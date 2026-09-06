// src/lib/priceTicker/providers/coingecko.ts
import type { PriceItem } from "@/types/priceTicker";

const SOURCE_URL = "https://call1.tgju.org/ajax.json";
const FETCH_TIMEOUT_MS = 8000;
const MAX_AGE_MS = 6 * 60 * 60 * 1000; // ۶ ساعت

// هر ارز دیجیتال یک نام فارسی، نام انگلیسی و لیست کلیدهای احتمالی در tgju دارد.
// اولویت از بالا به پایین است؛ اولین کلیدی که در JSON موجود باشد انتخاب می‌شود.
const CRYPTO_CONFIG: {
  name: string;
  nameEn: string;
  possibleKeys: string[];
}[] = [
  { name: "بیت‌کوین", nameEn: "Bitcoin", possibleKeys: ["bitcoin", "bitcoin-irr", "btc", "btc-usd", "bitcoin-usd"] },
  { name: "اتریوم", nameEn: "Ethereum", possibleKeys: ["ethereum", "ethereum-irr", "eth", "eth-usd", "ethereum-usd"] },
  { name: "تتر", nameEn: "Tether", possibleKeys: ["usdt", "usdt-irr", "tether", "tether-usd"] },
  { name: "بایننس کوین", nameEn: "BNB", possibleKeys: ["bnb", "bnb-irr", "binancecoin"] },
  { name: "ریپل", nameEn: "XRP", possibleKeys: ["xrp", "xrp-irr", "ripple"] },
  { name: "سولانا", nameEn: "Solana", possibleKeys: ["sol", "solana", "sol-usd", "solana-usd"] },
  { name: "دوج‌کوین", nameEn: "Dogecoin", possibleKeys: ["dogecoin", "doge", "doge-usd"] },
  { name: "کاردانو", nameEn: "Cardano", possibleKeys: ["cardano", "ada", "ada-usd"] },
  { name: "ترون", nameEn: "TRON", possibleKeys: ["tron", "trx", "trx-usd"] },
  { name: "تون‌کوین", nameEn: "Toncoin", possibleKeys: ["the-open-network", "ton", "gram"] },
];

function toNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/,/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function isRialKey(key: string): boolean {
  return key.endsWith("_irr") || key.endsWith("-irr") || key.includes("-irr") || key.includes("_irr");
}

export async function fetchCrypto(usdToTomanRate: number): Promise<PriceItem[]> {
  void usdToTomanRate; // استفاده از نرخ دلار در بخش‌های بعدی

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(SOURCE_URL, {
      signal: controller.signal,
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const current = json?.current;
    if (!current || typeof current !== "object") throw new Error("ساختار tgju نامعتبر است");

    const items: PriceItem[] = [];

    for (const config of CRYPTO_CONFIG) {
      // پیدا کردن اولین کلید موجود در JSON که تازه هم باشد
      let selectedKey: string | null = null;
      let selectedEntry: Record<string, unknown> | null = null;

      for (const key of config.possibleKeys) {
        if (key in current) {
          const entry = current[key] as Record<string, unknown>;
          const ts = entry.ts ? new Date(String(entry.ts)).getTime() : null;
          if (!ts || isNaN(ts) || Date.now() - ts > MAX_AGE_MS) continue;
          selectedKey = key;
          selectedEntry = entry;
          break;
        }
      }

      if (!selectedKey || !selectedEntry) continue;

      const rawPrice = toNumber(selectedEntry.p);
      if (!rawPrice || rawPrice <= 0) continue;

      // اگر کلید ریالی است → تبدیل به تومان (تقسیم بر ۱۰)
      // در غیر این صورت فرض می‌کنیم قیمت دلاری است → ضرب در نرخ دلار
      let priceToman: number;
      if (isRialKey(selectedKey)) {
        priceToman = Math.round(rawPrice / 10);
      } else {
        priceToman = usdToTomanRate > 0 ? Math.round(rawPrice * usdToTomanRate) : 0;
      }

      if (priceToman <= 0) continue;

      items.push({
        symbol: selectedKey.toUpperCase(),
        name: config.name,
        nameEn: config.nameEn,
        price: priceToman,
        changeValue: 0,
        changePercent: toNumber(selectedEntry.dp),
        unit: "تومان",
        icon: undefined,
      });
    }

    if (items.length === 0) throw new Error("هیچ آیتم کریپتو تازه‌ای در tgju یافت نشد");
    return items;
  } catch (err) {
    clearTimeout(timeout);
    throw err instanceof Error ? err : new Error("دریافت قیمت ارز دیجیتال ناموفق بود");
  }
}