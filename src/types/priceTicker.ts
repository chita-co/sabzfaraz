// src/types/priceTicker.ts
// تایپ‌های مشترک بخش «قیمت لحظه‌ای طلا، دلار و ارز دیجیتال»

export type PriceCategory = "currency" | "gold" | "crypto";

/** یک آیتم نرمال‌شده‌ی قیمت (بعد از پردازش خروجی خام API خارجی) */
export interface PriceItem {
  /** نماد یکتا، مثلاً USD یا IR_COIN_EMAMI — برای لینک به تاریخچه استفاده می‌شود */
  symbol: string;
  /** نام فارسی برای نمایش، مثلاً «دلار آمریکا» */
  name: string;
  /** نام انگلیسی (اختیاری) */
  nameEn?: string;
  /** قیمت لحظه‌ای، همیشه به تومان (نه ریال) */
  price: number;
  /** مقدار تغییر نسبت به روز قبل، به تومان (می‌تواند منفی باشد) */
  changeValue: number;
  /** درصد تغییر نسبت به روز قبل (می‌تواند منفی باشد) */
  changePercent: number;
  /** واحد نمایش اصلی، مثلاً «تومان» یا «گرم» */
  unit?: string;
  /** فقط برای دسته‌ی طلا: درصد حباب سکه نسبت به ارزش ذاتی (تقریبی) */
  bubblePercent?: number;
  icon?: string;
  /** فقط ارز دیجیتال: قیمت به دلار آمریکا (مستقیماً از CoinGecko) */
  usdPrice?: number;
  /** فقط ارز دیجیتال: حجم معاملات ۲۴ ساعته به دلار */
  volume24h?: number;
  /** فقط ارز دیجیتال: ارزش بازار به دلار */
  marketCap?: number;
  /** فقط ارز دیجیتال: رتبه‌ی بازار (۱ = بیت‌کوین) */
  rank?: number;
}

export interface PriceSnapshot {
  currency: PriceItem[];
  gold: PriceItem[];
  crypto: PriceItem[];
  /** زمان آخرین به‌روزرسانی موفق (ISO) — جدیدترین بین سه دسته */
  updatedAt: string;
  /**
   * true یعنی حداقل یکی از سه دسته این‌بار تازه‌سازی نشده و داده‌ی آخرین
   * نسخه‌ی معتبر ذخیره‌شده را نمایش می‌دهد (نه لزوماً همین چند ثانیه پیش).
   */
  stale: boolean;
  /** وضعیت به‌ازای هر دسته، برای نمایش دقیق‌تر پیام‌های خطا/تازگی */
  staleByCategory?: Partial<Record<PriceCategory, boolean>>;
}

export interface PriceHistoryPoint {
  t: string; // ISO timestamp
  price: number;
}
