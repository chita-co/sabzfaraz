// src/lib/priceTicker/providers/coingecko.ts
import type { PriceItem } from "@/types/priceTicker";

const SOURCE_URL = "https://call1.tgju.org/ajax.json";
const FETCH_TIMEOUT_MS = 8000;
const MAX_AGE_MS = 6 * 60 * 60 * 1000; // ۶ ساعت

const CRYPTO_KEYS: Record<string, string> = {
  "btc": "بیت‌کوین",
  "bitcoin": "بیت‌کوین",
  "eth": "اتریوم",
  "ethereum": "اتریوم",
  "usdt": "تتر",
  "tether": "تتر",
  "bnb": "بایننس کوین",
  "binancecoin": "بایننس کوین",
  "xrp": "ریپل",
  "ripple": "ریپل",
  "sol": "سولانا",
  "solana": "سولانا",
  "doge": "دوج‌کوین",
  "dogecoin": "دوج‌کوین",
  "ada": "کاردانو",
  "cardano": "کاردانو",
  "trx": "ترون",
  "tron": "ترون",
  "gram": "تون‌کوین",
  "ton": "تون‌کوین",
};

function toNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/,/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function normalizeToToman(price: number, key?: string): number {
  if (key && (key.endsWith("_rl") || key.endsWith("-irr"))) return Math.round(price / 10);
  return Math.round(price);
}

export async function fetchCrypto(usdToTomanRate: number): Promise<PriceItem[]> {
  void usdToTomanRate;
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

    for (const [key, raw] of Object.entries(current)) {
      const entry = raw as Record<string, unknown>;
      const keyLower = key.toLowerCase();

      // فقط کلیدهایی که شامل یکی از نمادهای کریپتو هستند
      const match = Object.keys(CRYPTO_KEYS).find((k) => keyLower.includes(k));
      if (!match) continue;

      // بررسی تازگی
      const ts = entry.ts ? new Date(String(entry.ts)).getTime() : null;
      if (!ts || isNaN(ts) || Date.now() - ts > MAX_AGE_MS) continue;

      const price = normalizeToToman(toNumber(entry.p), key);
      if (!price || price <= 0) continue;

      const name = CRYPTO_KEYS[match];
      const nameEn = String(entry["t_en"] ?? match.toUpperCase());
      const changePercent = toNumber(entry.dp);

      items.push({
        symbol: key.toUpperCase(),
        name,
        nameEn,
        price,
        changeValue: 0,
        changePercent,
        unit: "تومان",
        icon: undefined,
      });
    }

    if (items.length === 0) throw new Error("هیچ آیتم کریپتو در tgju یافت نشد");
    return items;
  } catch (err) {
    clearTimeout(timeout);
    throw err instanceof Error ? err : new Error("دریافت قیمت ارز دیجیتال ناموفق بود");
  }
}