// src/lib/priceTicker/providers/brsapi.ts
//
// منبع ارز و طلا/سکه: BrsApi (رایگان، بدون کلید).
// ⚠️ این وب‌سرویس مستند رسمی پایدار کاملی ندارد. به همین دلیل flattenPriceEntries
// به‌جای وابستگی به مسیر دقیق کلیدهای JSON، کل خروجی را می‌گردد و آیتم‌های
// شبیه قیمت را پیدا می‌کند. اگر بعد از دیپلوی یک ارز/سکه در لیست نبود، فقط
// کافی‌ست در همین فایل، در CURRENCY_KEYWORDS / GOLD_KEYWORDS کلمه‌ی جا افتاده
// را اضافه کنید.

import type { PriceItem } from "@/types/priceTicker";

const SOURCE_URLS = ["https://brsapi.ir/FreeTsetmcBourseApi/Api_Free_Gold_Currency_v2.json"];
const FETCH_TIMEOUT_MS = 8000;

const CURRENCY_KEYWORDS = [
  "دلار", "یورو", "پوند", "درهم", "لیر", "یوان", "فرانک", "روپیه", "دینار",
  "ریال عربستان", "کرون", "روبل", "وون", "دلار کانادا", "دلار استرالیا",
];
const CURRENCY_KEYWORDS_EN = [
  "dollar", "euro", "pound", "dirham", "lira", "yuan", "franc", "rupee",
  "dinar", "krona", "krone", "ruble", "won", "riyal",
];

const GOLD_KEYWORDS = ["طلا", "سکه", "انس", "مثقال"];
const GOLD_KEYWORDS_EN = ["gold", "coin", "ounce", "mesghal", "mithqal", "sekee", "geram", "bahar", "emami"];

// وزن تقریبی (گرم) و عیار سکه‌های رایج، فقط برای محاسبه‌ی تقریبیِ «درصد حباب»
const COIN_SPECS: { match: RegExp; grams: number; purity: number }[] = [
  { match: /امامی/, grams: 8.133, purity: 0.9 },
  { match: /بهار\s*آزادی/, grams: 8.133, purity: 0.9 },
  { match: /نیم\s*سکه/, grams: 4.066, purity: 0.9 },
  { match: /ربع\s*سکه/, grams: 2.033, purity: 0.9 },
  { match: /گرمی/, grams: 1.0, purity: 0.9 },
];

interface RawEntry {
  symbol?: string;
  name?: string;
  name_en?: string;
  price?: number | string;
  change_value?: number | string;
  change_percent?: number | string;
  unit?: string;
  path_icon?: string;
  [key: string]: unknown;
}

function toNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/,/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function flattenPriceEntries(node: unknown, out: RawEntry[] = [], depth = 0): RawEntry[] {
  if (depth > 6 || node == null) return out;
  if (Array.isArray(node)) {
    for (const item of node) flattenPriceEntries(item, out, depth + 1);
    return out;
  }
  if (typeof node === "object") {
    const obj = node as RawEntry;
    const hasPrice = obj.price !== undefined || (obj as Record<string, unknown>).p !== undefined;
    const hasSymbolOrName = typeof obj.symbol === "string" || typeof obj.name === "string";
    if (hasPrice && hasSymbolOrName) out.push(obj);
    for (const key of Object.keys(obj)) {
      const val = (obj as Record<string, unknown>)[key];
      if (val && typeof val === "object") flattenPriceEntries(val, out, depth + 1);
    }
  }
  return out;
}

function normalizeToToman(price: number, unit?: string): number {
  if (unit && unit.includes("ریال")) return Math.round(price / 10);
  if (!unit && price > 5_000_000) return Math.round(price / 10);
  return Math.round(price);
}

function classify(entry: RawEntry): "currency" | "gold" | null {
  const symbol = (entry.symbol || "").toUpperCase().trim();
  const symbolLower = symbol.toLowerCase();
  const name = (entry.name || "").trim();
  const nameEn = (entry.name_en || "").toLowerCase().trim();

  const isGold =
    GOLD_KEYWORDS.some((k) => name.includes(k)) ||
    GOLD_KEYWORDS_EN.some((k) => nameEn.includes(k) || symbolLower.includes(k));
  if (isGold) return "gold";

  const isCurrency =
    CURRENCY_KEYWORDS.some((k) => name.includes(k)) ||
    CURRENCY_KEYWORDS_EN.some((k) => nameEn.includes(k)) ||
    /^[A-Z]{3}$/.test(symbol);
  if (isCurrency) return "currency";

  return null;
}

function computeBubble(name: string, priceToman: number, gold18kToman: number | null): number | undefined {
  if (!gold18kToman) return undefined;
  const spec = COIN_SPECS.find((s) => s.match.test(name));
  if (!spec) return undefined;
  const gold24kPerGram = gold18kToman / 0.75;
  const intrinsic = spec.grams * spec.purity * gold24kPerGram;
  if (intrinsic <= 0) return undefined;
  return Math.round(((priceToman - intrinsic) / intrinsic) * 1000) / 10;
}

export interface CurrencyGoldResult {
  currency: PriceItem[];
  gold: PriceItem[];
}

export async function fetchCurrencyAndGold(): Promise<CurrencyGoldResult> {
  let lastError: unknown = null;

  for (const url of SOURCE_URLS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      const res = await fetch(url, { signal: controller.signal, headers: { accept: "application/json" }, cache: "no-store" });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      const entries = flattenPriceEntries(json);
      if (entries.length === 0) throw new Error("پاسخ BrsApi خالی یا با ساختار ناشناخته بود");

      let gold18kToman: number | null = null;
for (const e of entries) {
  const name = e.name || "";
  const nameEn = (e.name_en || "").toLowerCase();
  const is18k = (name.includes("طلا") || nameEn.includes("gold")) && (name.includes("۱۸") || name.includes("18"));
  if (is18k) {
    gold18kToman = normalizeToToman(toNumber(e.price), e.unit);
  }
}

      const currency: PriceItem[] = [];
      const gold: PriceItem[] = [];

      for (const e of entries) {
        const category = classify(e);
        if (!category) continue;
        const priceToman = normalizeToToman(toNumber(e.price), e.unit);
        if (!priceToman || priceToman <= 0) continue;

        const item: PriceItem = {
          symbol: e.symbol || e.name || `${category}-${currency.length + gold.length}`,
          name: e.name || e.symbol || "نامشخص",
          nameEn: e.name_en,
          price: priceToman,
          changeValue: normalizeToToman(toNumber(e.change_value), e.unit),
          changePercent: toNumber(e.change_percent),
          unit: category === "gold" && /گرم|مثقال/.test(e.name || "") ? "تومان / گرم" : "تومان",
          icon: e.path_icon,
        };

        if (category === "gold") item.bubblePercent = computeBubble(item.name, item.price, gold18kToman);
        if (category === "currency") currency.push(item);
        else gold.push(item);
      }

      if (currency.length === 0 && gold.length === 0) {
  const sample = JSON.stringify(entries.slice(0, 3)).slice(0, 500);
  throw new Error(`هیچ آیتم ارز/طلایی در پاسخ BrsApi پیدا نشد (ساختار پاسخ عوض شده؟) — نمونه‌ی داده: ${sample}`);
}

      return { currency, gold };
    } catch (err) {
      lastError = err;
      continue;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("دریافت قیمت ارز/طلا ناموفق بود");
}

/** برای استفاده‌ی بیرونی (محاسبه‌ی سکه در ابزار تبدیل) */
export { COIN_SPECS };
