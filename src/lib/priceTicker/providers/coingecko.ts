// src/lib/priceTicker/providers/coingecko.ts
//
// منبع ارز دیجیتال: CoinGecko Public API — رایگان، بدون نیاز به کلید،
// مستندات رسمی و پایدار (برخلاف منبع ارز/طلا، اینجا از ساختار دقیق و
// شناخته‌شده‌ی endpoint استفاده می‌کنیم چون کاملاً مستند و قابل‌اعتماد است).
//
// چون CoinGecko قیمت را مستقیم به تومان نمی‌دهد، قیمت دلاری هر کوین را با
// نرخ لحظه‌ای دلار/تومان (که از BrsApi می‌آید) ضرب می‌کنیم تا هم قیمت دلاری
// دقیق CoinGecko حفظ شود و هم معادل تومانی متناسب با نرخ ارز خودِ سایت نمایش
// داده شود.

import type { PriceItem } from "@/types/priceTicker";

const COINGECKO_URL =
  "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=" +
  ["bitcoin", "ethereum", "tether", "binancecoin", "ripple", "solana", "dogecoin", "cardano", "tron", "the-open-network"].join(",") +
  "&order=market_cap_desc&price_change_percentage=24h&sparkline=false";

const FETCH_TIMEOUT_MS = 8000;
const MAX_AGE_MS = 6 * 60 * 60 * 1000; // ۶ ساعت — قابل تغییر

const PERSIAN_NAMES: Record<string, string> = {
  bitcoin: "بیت‌کوین",
  ethereum: "اتریوم",
  tether: "تتر",
  binancecoin: "بایننس کوین",
  ripple: "ریپل",
  solana: "سولانا",
  dogecoin: "دوج‌کوین",
  cardano: "کاردانو",
  tron: "ترون",
  "the-open-network": "تون‌کوین",
};

interface CoinGeckoEntry {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number | null;
  total_volume: number;
  market_cap: number;
  market_cap_rank: number;
  image?: string;
  last_updated?: string;
}

export async function fetchCrypto(usdToTomanRate: number): Promise<PriceItem[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(COINGECKO_URL, {
      signal: controller.signal,
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json: CoinGeckoEntry[] = await res.json();
    if (!Array.isArray(json) || json.length === 0) throw new Error("پاسخ CoinGecko خالی بود");

    const items: PriceItem[] = [];
    for (const c of json) {
      // بررسی تازگی داده
      const lastUpdated = c.last_updated ? new Date(c.last_updated).getTime() : null;
      if (!lastUpdated || isNaN(lastUpdated) || Date.now() - lastUpdated > MAX_AGE_MS) {
        continue; // آیتم قدیمی‌تر از حد مجاز را حذف می‌کنیم
      }

      items.push({
        symbol: c.symbol.toUpperCase(),
        name: PERSIAN_NAMES[c.id] || c.name,
        nameEn: c.name,
        usdPrice: c.current_price,
        price: usdToTomanRate > 0 ? Math.round(c.current_price * usdToTomanRate) : 0,
        changeValue: 0,
        changePercent: c.price_change_percentage_24h ?? 0,
        unit: "تومان",
        volume24h: c.total_volume,
        marketCap: c.market_cap,
        rank: c.market_cap_rank,
        icon: c.image,
      });
    }
    return items;
  } catch (err) {
    clearTimeout(timeout);
    throw err instanceof Error ? err : new Error("دریافت قیمت ارز دیجیتال از CoinGecko ناموفق بود");
  }
}
