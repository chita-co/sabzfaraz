// src/lib/nationalId.ts

/**
 * اعتبارسنجی فرمت و رقم کنترلی کدملی ایران (الگوریتم استاندارد ۱۰ رقمی).
 * توجه: این فقط صحتِ ساختاریِ کد را می‌سنجد؛ اثبات نمی‌کند که کد متعلق
 * به همان مالک شماره موبایل است (برای آن به سرویس استعلام شاهکار نیاز است).
 */
export function isValidIranianNationalId(input: string): boolean {
  const code = (input || "").trim();
  if (!/^\d{10}$/.test(code)) return false;
  if (/^(\d)\1{9}$/.test(code)) return false; // کدهای تکراری مثل 1111111111

  const check = parseInt(code[9], 10);
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(code[i], 10) * (10 - i);
  }
  const remainder = sum % 11;
  return remainder < 2 ? check === remainder : check === 11 - remainder;
}

export function toEnglishDigits(value: string): string {
  const persian = "۰۱۲۳۴۵۶۷۸۹";
  const arabic = "٠١٢٣٤٥٦٧٨٩";
  return value.replace(/[۰-۹٠-٩]/g, (d) => {
    const pIdx = persian.indexOf(d);
    if (pIdx > -1) return String(pIdx);
    const aIdx = arabic.indexOf(d);
    return aIdx > -1 ? String(aIdx) : d;
  });
}