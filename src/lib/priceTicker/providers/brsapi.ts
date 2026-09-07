// src/lib/priceTicker/providers/brsapi.ts
import type { PriceItem } from "@/types/priceTicker";


const MAX_AGE_MS = 24 * 60 * 60 * 1000;
const SOURCE_URLS = ["https://call1.tgju.org/ajax.json"];
const FETCH_TIMEOUT_MS = 8000;

const CURRENCY_KEYWORDS = [
  "دلار", "یورو", "پوند", "درهم", "لیر", "یوان", "فرانک", "روپیه", "دینار",
  "ریال عربستان", "کرون", "روبل", "وون", "دلار کانادا", "دلار استرالیا",
];
const CURRENCY_KEYWORDS_EN = [
  "dollar", "euro", "pound", "dirham", "lira", "yuan", "franc", "rupee",
  "dinar", "krona", "krone", "ruble", "won", "riyal",
];

const GOLD_KEYWORDS = ["طلا", "سکه", "انس", "مثقال", "نقره"];
const GOLD_KEYWORDS_EN = ["gold", "coin", "ounce", "mesghal", "mithqal", "sekee", "geram", "bahar", "emami", "silver"];

// وزن تقریبی (گرم) و عیار سکه‌های رایج
const COIN_SPECS: { match: RegExp; grams: number; purity: number }[] = [
  { match: /امامی/, grams: 8.133, purity: 0.9 },
  { match: /بهار\s*آزادی/, grams: 8.133, purity: 0.9 },
  { match: /نیم\s*سکه/, grams: 4.066, purity: 0.9 },
  { match: /ربع\s*سکه/, grams: 2.033, purity: 0.9 },
  { match: /گرمی/, grams: 1.0, purity: 0.9 },
];

function toNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/,/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function normalizeToToman(price: number, unit?: string): number {
  // همه‌ی قیمت‌های tgju به ریال هستند؛ برای تبدیل به تومان همیشه تقسیم بر ۱۰ می‌کنیم
  void unit; // پارامتر unit برای سازگاری با فراخوانی‌ها حفظ می‌شود
  return Math.round(price / 10);
}

const NAME_MAP: Record<string, string> = {
  "price_dollar_rl": "دلار",
  "price_eur": "یورو",
  "price_gbp": "پوند",
  "price_aed": "درهم",
  "price_try": "لیر",
  "price_cny": "یوان",
  "price_chf": "فرانک",
  "price_inr": "روپیه",
  "price_iqd": "دینار",
  "price_sar": "ریال عربستان",
  "price_sek": "کرون",
  "price_rub": "روبل",
  "price_krw": "وون",
  "price_cad": "دلار کانادا",
  "price_aud": "دلار استرالیا",

   // 🟢 ارزهای جدید
  "price_jpy": "ین ژاپن",
  "price_myr": "رینگیت مالزی",
  "price_thb": "بات تایلند",
  "price_sgd": "دلار سنگاپور",
  "price_hkd": "دلار هنگ کنگ",
  "price_nzd": "دلار نیوزیلند",
  "price_dkk": "کرون دانمارک",
  "price_nok": "کرون نروژ",
  "price_pln": "زلوتی لهستان",
  "price_zar": "راند آفریقای جنوبی",
  "price_brl": "رئال برزیل",
  "price_afn": "افغانی",
  "price_pkr": "روپیه پاکستان",
  "price_azn": "منات آذربایجان",
  "price_amd": "درام ارمنستان",
  "price_kzt": "تنگه قزاقستان",
  "price_uah": "هریونیا اوکراین",
  "price_byn": "روبل بلاروس",
  "price_gel": "لاری گرجستان",
  "price_omr": "ریال عمان",
  "price_qar": "ریال قطر",
  "price_kwd": "دینار کویت",
  "price_bhd": "دینار بحرین",
  "price_jod": "دینار اردن",
  "price_lyd": "دینار لیبی",
  "price_egp": "پوند مصر",
  "price_lbp": "لیره لبنان",
  "price_syp": "لیره سوریه",
  "price_tnd": "دینار تونس",
  "price_mad": "درهم مراکش",
  "price_yer": "ریال یمن",

  "sekee": "سکه امامی",
  "nim_sekee": "نیم سکه",
  "rob_sekee": "ربع سکه",
  "gerami": "سکه گرمی",
  "gold_18k": "طلای ۱۸ عیار",
  "gold_24k": "طلای ۲۴ عیار",
  "mesghal": "مثقال طلا",
  "silver": "نقره",
  "silver_999": "نقره ۹۹۹",
  "silver_925": "نقره ۹۲۵",
};

const CURRENCY_ORDER = [
  "price_dollar_rl",  // دلار
  "price_eur",        // یورو
  "price_gbp",        // پوند
  "price_aed",        // درهم
  "price_try",        // لیر
  "price_cny",        // یوان
  "price_chf",        // فرانک
  "price_inr",        // روپیه
  "price_iqd",        // دینار
  "price_sar",        // ریال عربستان
  "price_sek",        // کرون
  "price_rub",        // روبل
  "price_krw",        // وون
  "price_cad",        // دلار کانادا
  "price_aud",        // دلار استرالیا

  // ارزهای جدید
  "price_jpy",
  "price_myr",
  "price_thb",
  "price_sgd",
  "price_hkd",
  "price_nzd",
  "price_dkk",
  "price_nok",
  "price_pln",
  "price_zar",
  "price_brl",
  "price_afn",
  "price_pkr",
  "price_azn",
  "price_amd",
  "price_kzt",
  "price_uah",
  "price_byn",
  "price_gel",
  "price_omr",
  "price_qar",
  "price_kwd",
  "price_bhd",
  "price_jod",
  "price_lyd",
  "price_egp",
  "price_lbp",
  "price_syp",
  "price_tnd",
  "price_mad",
  "price_yer",
];

const GOLD_ORDER = [
  "sekee",            // سکه امامی
  "nim_sekee",        // نیم سکه
  "rob_sekee",        // ربع سکه
  "gerami",           // سکه گرمی
  "gold_18k",         // طلای ۱۸ عیار
  "gold_24k",         // طلای ۲۴ عیار
  "mesghal",          // مثقال طلا
  "silver",           // نقره
  "silver_925",       // نقره ۹۲۵
  "silver_999",       // نقره ۹۹۹
];

function resolveName(key: string): string {
  return NAME_MAP[key] ?? key.replace(/_/g, " ");
}

function classify(key: string, name: string, nameEn: string): "currency" | "gold" | null {
  const keyLower = key.toLowerCase();
  const nameEnLower = nameEn.toLowerCase();

  // اگر کلید در لیست ارزهاست، ارز است
  if (CURRENCY_ORDER.includes(key)) return "currency";
  // اگر کلید در لیست طلا/نقره است، طلا است
  if (GOLD_ORDER.includes(key)) return "gold";

  // بررسی‌های تکمیلی
  if (
    keyLower.includes("gold") ||
    keyLower.includes("sekee") ||
    keyLower.includes("sekeh") ||
    keyLower.includes("sekeb") ||
    keyLower.includes("nim") ||
    keyLower.includes("rob") ||
    keyLower.includes("geram") ||
    keyLower.includes("mesghal") ||
    keyLower.includes("silver") ||
    GOLD_KEYWORDS.some((k) => name.includes(k)) ||
    GOLD_KEYWORDS_EN.some((k) => nameEnLower.includes(k) || keyLower.includes(k))
  ) {
    return "gold";
  }

  if (
    keyLower.startsWith("price_") ||
    /^[a-z]{3}(_|$)/.test(keyLower) ||
    CURRENCY_KEYWORDS.some((k) => name.includes(k)) ||
    CURRENCY_KEYWORDS_EN.some((k) => nameEnLower.includes(k)) ||
    /^[A-Z]{3}$/.test(key.toUpperCase())
  ) {
    return "currency";
  }

  return null;
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

      // انتظار ساختار { current: { key: { p, d, dp, t, t_en, ... } } }
      const current = json?.current;
      if (!current || typeof current !== "object") {
        throw new Error("ساختار پاسخ tgju نامعتبر است");
      }

      const currency: PriceItem[] = [];
      const gold: PriceItem[] = [];

      // برای محاسبه حباب سکه به قیمت طلای ۱۸ عیار نیاز داریم
      let gold18kToman: number | null = null;

      // ابتدا کلیدهای طلا را پیدا کنیم تا gold18kToman را استخراج کنیم
      for (const [key, raw] of Object.entries(current)) {
        const entry = raw as Record<string, unknown>;

        // بررسی تازگی داده
  const ts = entry.ts ? new Date(String(entry.ts)).getTime() : null;
  if (!ts || isNaN(ts) || Date.now() - ts > MAX_AGE_MS) continue;

        const name = resolveName(key);
        const nameEn = String(entry["t_en"] ?? "");
        if (classify(key, name, nameEn) === "gold") {
          const price = normalizeToToman(toNumber(entry.p));
          if (price > 0 && (key.includes("gol") || key.includes("gold") || name.includes("طلا"))) {
            gold18kToman = price;
            break;
          }
        }
      }

      // حالا همه آیتم‌ها را پردازش می‌کنیم
      for (const [key, raw] of Object.entries(current)) {
        const entry = raw as Record<string, unknown>;
        const priceToman = normalizeToToman(toNumber(entry.p));
        if (!priceToman || priceToman <= 0) continue;

        const name = resolveName(key);
        const nameEn = String(entry["t_en"] ?? "");
        const category = classify(key, name, nameEn);
        if (!category) continue;

        // فقط آیتم‌هایی که نام فارسی دارند پردازش شوند
        if (!(key in NAME_MAP)) continue;

        const item: PriceItem = {
          symbol: key,
          name: name,
          nameEn: nameEn || undefined,
          price: priceToman,
          changeValue: normalizeToToman(toNumber(entry.d)),
          changePercent: toNumber(entry.dp),
          unit: "تومان",
          icon: undefined,
        };

        if (category === "gold") {
          item.bubblePercent = computeBubble(name, priceToman, gold18kToman);
          gold.push(item);
        } else {
          currency.push(item);
        }
      }

      if (currency.length === 0 && gold.length === 0) {
        throw new Error("هیچ آیتم ارز/طلایی در پاسخ tgju پیدا نشد");
      }

      const orderIndex = (arr: string[], key: string) => {
  const idx = arr.indexOf(key);
  return idx === -1 ? arr.length : idx;
};

currency.sort((a, b) => orderIndex(CURRENCY_ORDER, a.symbol) - orderIndex(CURRENCY_ORDER, b.symbol));
gold.sort((a, b) => orderIndex(GOLD_ORDER, a.symbol) - orderIndex(GOLD_ORDER, b.symbol));

      return { currency, gold };
    } catch (err) {
      lastError = err;
      continue;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("دریافت قیمت ارز/طلا ناموفق بود");
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

export { COIN_SPECS };