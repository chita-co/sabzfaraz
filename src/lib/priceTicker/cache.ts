// src/lib/priceTicker/cache.ts
//
// معماری «بدون کرون‌جاب» (بدون تغییر نسبت به نسخه‌ی قبلی)، با این تفاوت که
// حالا دو منبع مستقل داریم:
//   • BrsApi → ارز + طلا/سکه
//   • CoinGecko → ارز دیجیتال (قیمت‌های دلاری دقیق و مستند)
// چون این دو منبع کاملاً مستقل‌اند، اگر یکی از آن‌ها موقتاً از دسترس خارج شود،
// روی دیگری تأثیری نمی‌گذارد — هرکدام جدا claim/refresh/fail می‌شوند.
//
//  ۱. هر درخواست به /api/price-ticker اول کش موجود در Supabase را می‌خواند.
//  ۲. اگر عمر کش هر گروه از STALE_MS بیشتر شده باشد، همان درخواست (نه یک
//     کرون جدا) مسئولیت تازه‌سازی همان گروه را برعهده می‌گیرد.
//  ۳. یک UPDATE شرطی روی خودِ Supabase به‌عنوان قفل سبک (optimistic lock)
//     استفاده می‌شود تا در ترافیک بالا چند درخواست هم‌زمان چندبار به API
//     خارجی ضربه نزنند.
//  ۴. اگر یک منبع خطا بدهد، فقط همان دسته(ها) is_stale=true می‌شوند و آخرین
//     داده‌ی معتبرشان دست‌نخورده می‌ماند؛ دسته‌های دیگر که تازه شدند طبیعی
//     نمایش داده می‌شوند.

import { createAdminClient } from "@/lib/supabase/admin";
import { fetchCurrencyAndGold } from "./providers/brsapi";
import { fetchCrypto } from "./providers/coingecko";
import type { PriceCategory, PriceItem, PriceSnapshot } from "@/types/priceTicker";

const STALE_MS = 300_000; // هدف: هر ۵ دقیقه یک‌بار تازه
const HISTORY_RETENTION_DAYS = 8;
const HISTORY_ITEMS_PER_CATEGORY = 12;

interface CacheRow {
  category: PriceCategory;
  items: PriceItem[];
  fetched_at: string;
  is_stale: boolean;
  last_error: string | null;
}

function admin() {
  return createAdminClient();
}

async function readCache(): Promise<CacheRow[]> {
  const { data } = await admin().from("price_ticker_cache").select("category, items, fetched_at, is_stale, last_error");
  return (data as CacheRow[]) ?? [];
}

async function tryClaim(lockCategory: PriceCategory): Promise<boolean> {
  const cutoff = new Date(Date.now() - STALE_MS).toISOString();
  const { data, error } = await admin()
    .from("price_ticker_cache")
    .update({ fetched_at: new Date().toISOString() })
    .eq("category", lockCategory)
    .lt("fetched_at", cutoff)
    .select("category");
  if (error) return false;
  return (data?.length ?? 0) > 0;
}

async function writeCategories(entries: { category: PriceCategory; items: PriceItem[] }[]) {
  const now = new Date().toISOString();
  await Promise.all(
    entries.map(({ category, items }) =>
      admin().from("price_ticker_cache").update({ items, fetched_at: now, is_stale: false, last_error: null }).eq("category", category)
    )
  );

  const historyRows = entries.flatMap(({ category, items }) =>
    items.slice(0, HISTORY_ITEMS_PER_CATEGORY).map((item) => ({ category, symbol: item.symbol, price: item.price, recorded_at: now }))
  );
  if (historyRows.length > 0) {
    await admin().from("price_ticker_history").insert(historyRows);
  }

  const trimCutoff = new Date(Date.now() - HISTORY_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await admin().from("price_ticker_history").delete().lt("recorded_at", trimCutoff);
}

async function markFailed(categories: PriceCategory[], message: string) {
  await Promise.all(
    categories.map((category) => admin().from("price_ticker_cache").update({ is_stale: true, last_error: message }).eq("category", category))
  );
}

function findUsdRate(currencyItems: PriceItem[]): number | null {
  const item = currencyItems.find((i) => i.symbol.toUpperCase() === "USD" || i.name.includes("دلار آمریکا"));
  return item?.price ?? null;
}

function rowsToSnapshot(rows: CacheRow[]): PriceSnapshot {
  const byCategory = new Map(rows.map((r) => [r.category, r]));
  const updatedAt = rows.length > 0 ? rows.reduce((max, r) => (r.fetched_at > max ? r.fetched_at : max), rows[0].fetched_at) : new Date(0).toISOString();
  const staleByCategory: Partial<Record<PriceCategory, boolean>> = {};
  const errors: Partial<Record<PriceCategory, string>> = {};
  for (const r of rows) {
    staleByCategory[r.category] = r.is_stale;
    if (r.last_error) errors[r.category] = r.last_error;
  }

  return {
    currency: byCategory.get("currency")?.items ?? [],
    gold: byCategory.get("gold")?.items ?? [],
    crypto: byCategory.get("crypto")?.items ?? [],
    updatedAt,
    stale: rows.some((r) => r.is_stale),
    staleByCategory,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  };
}

export async function getPriceSnapshot(): Promise<PriceSnapshot> {
  const rows = await readCache();
  const byCategory = new Map(rows.map((r) => [r.category, r]));

  const isGroupStale = (categories: PriceCategory[]) =>
    categories.some((c) => {
      const row = byCategory.get(c);
      if (!row) return true;
      if ((row.items?.length ?? 0) === 0) return true;
      return Date.now() - new Date(row.fetched_at).getTime() > STALE_MS;
    });

  const brsapiIsEmpty = (byCategory.get("currency")?.items?.length ?? 0) === 0;
  const cryptoIsEmpty = (byCategory.get("crypto")?.items?.length ?? 0) === 0;
  const needsBrsapi = isGroupStale(["currency", "gold"]);
  const needsCrypto = isGroupStale(["crypto"]);

  const tasks: Promise<void>[] = [];

  const refreshBrsapi = async () => {
    const claimed = brsapiIsEmpty ? true : await tryClaim("currency");
    if (!claimed) return;
    try {
      const result = await fetchCurrencyAndGold();
      await writeCategories([
        { category: "currency", items: result.currency },
        { category: "gold", items: result.gold },
      ]);
      byCategory.set("currency", { category: "currency", items: result.currency, fetched_at: new Date().toISOString(), is_stale: false, last_error: null });
      byCategory.set("gold", { category: "gold", items: result.gold, fetched_at: new Date().toISOString(), is_stale: false, last_error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : "خطای نامشخص در دریافت ارز/طلا";
      await markFailed(["currency", "gold"], message);
      const row = byCategory.get("currency");
      if (row) byCategory.set("currency", { ...row, is_stale: true, last_error: message });
      const goldRow = byCategory.get("gold");
      if (goldRow) byCategory.set("gold", { ...goldRow, is_stale: true, last_error: message });
    }
  };

  const refreshCrypto = async () => {
    const claimed = cryptoIsEmpty ? true : await tryClaim("crypto");
    if (!claimed) return;
    try {
      // اگر نرخ دلار در دسترس نبود (فقط در اولین اجرای مطلق بعد از دیپلوی
      // که هنوز هیچ کش ارزی وجود ندارد)، از یک نرخ تقریبی به‌عنوان آخرین راه‌حل
      // استفاده می‌شود تا صفحه خالی نماند؛ در تازه‌سازی بعدی (۳۰ ثانیه دیگر)
      // خودش با نرخ واقعی اصلاح می‌شود.
      const usdRate = findUsdRate(byCategory.get("currency")?.items ?? []) ?? 100_000;
      const cryptoItems = await fetchCrypto(usdRate);
      await writeCategories([{ category: "crypto", items: cryptoItems }]);
      byCategory.set("crypto", { category: "crypto", items: cryptoItems, fetched_at: new Date().toISOString(), is_stale: false, last_error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : "خطای نامشخص در دریافت ارز دیجیتال";
      await markFailed(["crypto"], message);
      const row = byCategory.get("crypto");
      if (row) byCategory.set("crypto", { ...row, is_stale: true, last_error: message });
    }
  };

  if (needsBrsapi && needsCrypto && brsapiIsEmpty) {
    // سردترین حالت ممکن (اولین درخواست مطلق بعد از دیپلوی): اول نرخ دلار را
    // بگیر تا تبدیل قیمت کریپتو به تومان از همان ابتدا دقیق باشد.
    await refreshBrsapi();
    tasks.push(refreshCrypto());
  } else {
    if (needsBrsapi) tasks.push(refreshBrsapi());
    if (needsCrypto) tasks.push(refreshCrypto());
  }

  if (tasks.length > 0) await Promise.allSettled(tasks);

  return rowsToSnapshot(Array.from(byCategory.values()));
}
