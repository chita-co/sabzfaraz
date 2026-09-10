// src/lib/calendar/jalali.ts
//
// تبدیل تاریخ شمسی↔میلادی با الگوریتم استاندارد و شناخته‌شده‌ی «جلالی» (بدون
// هیچ پکیج خارجی) + تبدیل تقریبی به قمری (هجری). این‌جا هیچ API یا سرویس
// بیرونی درگیر نیست، پس هیچ‌وقت قطع/کند نمی‌شود.
//
// ⚠️ نکته درباره‌ی تقویم قمری: تاریخ قمری واقعی بر اساس رؤیت هلال ماه در هر
// کشور اعلام می‌شود و می‌تواند با محاسبه‌ی ریاضی (این تابع) یک روز اختلاف
// داشته باشد. برای مناسبت‌های مذهبی رسمی همیشه اعلام رسمی را هم چک کنید.

import type { JalaliDate } from "@/types/calendar";

/** تقسیم صحیح به‌سمت صفر (همان قرارداد الگوریتم اصلی Borkowski) — این تابع در
 *  نسخه‌ی قبلی این فایل جا افتاده بود و باعث محاسبه‌ی کاملاً غلط تاریخ شمسی
 *  (و در نتیجه گم‌شدن روزها/ماه‌ها) می‌شد. */
function div(a: number, b: number): number {
  return Math.trunc(a / b);
}

export const JALALI_MONTH_NAMES = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];

export const GREGORIAN_MONTH_NAMES_FA = [
  "ژانویه", "فوریه", "مارس", "آوریل", "مه", "ژوئن",
  "ژوئیه", "اوت", "سپتامبر", "اکتبر", "نوامبر", "دسامبر",
];

export const HIJRI_MONTH_NAMES = [
  "محرم", "صفر", "ربیع‌الاول", "ربیع‌الثانی", "جمادی‌الاول", "جمادی‌الثانی",
  "رجب", "شعبان", "رمضان", "شوال", "ذی‌القعده", "ذی‌الحجه",
];

export const WEEKDAY_NAMES_FA = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"];
export const WEEKDAY_SHORT_FA = ["ی", "د", "س", "چ", "پ", "ج", "ش"];

function mod(a: number, b: number): number {
  return a - div(a, b) * b;
}

const JALALI_BREAKS = [
  -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097,
  2192, 2262, 2324, 2394, 2456, 3178,
];

/** هسته‌ی مشترک الگوریتم جلالی (Borkowski) — هم برای رفت و هم برگشت استفاده می‌شود
 *  تا هیچ‌وقت دو نسخه‌ی ناهماهنگ از فرمول در جاهای مختلف کد نباشد. */
function jalCal(jy: number): { leap: number; gy: number; march: number } {
  const gy = jy + 621;
  let leapJ = -14;
  let jp = JALALI_BREAKS[0];
  let jump = 0;
  for (let i = 1; i < JALALI_BREAKS.length; i += 1) {
    const jm2 = JALALI_BREAKS[i];
    jump = jm2 - jp;
    if (jy < jm2) break;
    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm2;
  }
  let n = jy - jp;
  leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;
  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;
  return { leap, gy, march };
}

/** روز-شماره‌ی ژولین از تاریخ میلادی (gy,gm,gd به‌ترتیب سال/ماه/روز، ماه از ۱) */
function gregorianToJdn(gy: number, gm: number, gd: number): number {
  const d =
    div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
    div(153 * mod(gm + 9, 12) + 2, 5) +
    gd -
    34840408;
  return d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
}

function jdnToGregorian(jdn: number): [number, number, number] {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return [gy, gm, gd];
}

function jalaliToJdn(jy: number, jm: number, jd: number): number {
  const r = jalCal(jy);
  return gregorianToJdn(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
}

function jdnToJalali(jdn: number): JalaliDate {
  const [gy] = jdnToGregorian(jdn);
  let jy = gy - 621;
  const r = jalCal(jy);
  const jdn1f = gregorianToJdn(r.gy, 3, r.march);
  let k = jdn - jdn1f;
  if (k >= 0) {
    if (k <= 185) {
      const jm = 1 + div(k, 31);
      const jd = mod(k, 31) + 1;
      return { jy, jm, jd };
    }
    k -= 186;
  } else {
    jy -= 1;
    k += 179;
    if (jalCal(jy).leap === 1) k += 1;
  }
  const jm = 7 + div(k, 30);
  const jd = mod(k, 30) + 1;
  return { jy, jm, jd };
}

export function isLeapJalaliYear(jy: number): boolean {
  return jalCal(jy).leap === 1;
}

export function jalaliMonthLength(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isLeapJalaliYear(jy) ? 30 : 29;
}

/** تبدیل تاریخ جاوااسکریپتی (میلادی، لوکال) به شمسی */
export function toJalali(date: Date): JalaliDate {
  const jdn = gregorianToJdn(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return jdnToJalali(jdn);
}

/** تبدیل تاریخ شمسی به Date جاوااسکریپتی (ساعت ۰۰:۰۰ لوکال) */
export function fromJalali(jy: number, jm: number, jd: number): Date {
  const jdn = jalaliToJdn(jy, jm, jd);
  const [gy, gm, gd] = jdnToGregorian(jdn);
  return new Date(gy, gm - 1, gd);
}

export function formatJalali(date: Date, withWeekday = true): string {
  const { jy, jm, jd } = toJalali(date);
  const w = withWeekday ? `${WEEKDAY_NAMES_FA[date.getDay()]}، ` : "";
  return `${w}${jd} ${JALALI_MONTH_NAMES[jm - 1]} ${jy}`;
}

/**
 * تبدیل تقریبی به تاریخ قمری (هجری) با فرمول عددی رایج (Kuwaiti algorithm).
 * دقت: ± ۱ روز نسبت به رؤیت رسمی هلال در برخی ماه‌ها ممکن است.
 */
export function toApproximateHijri(date: Date): { hy: number; hm: number; hd: number } {
  // +۱ برای اصلاح اختلاف یک‌روزه‌ی رایج این فرمول عددی نسبت به تقویم قمری مرجع
  const jdn = gregorianToJdn(date.getFullYear(), date.getMonth() + 1, date.getDate()) + 1;
  const l = jdn - 1948440 + 10632;
  const n = div(l - 1, 10631);
  let ll = l - 10631 * n + 354;
  const j =
    div(10985 - ll, 5316) * div(50 * ll, 17719) + div(ll, 5670) * div(43 * ll, 15238);
  ll =
    ll -
    div(30 - j, 15) * div(17719 * j, 50) -
    div(j, 16) * div(15238 * j, 43) +
    29;
  const hm = div(24 * ll, 709);
  const hd = ll - div(709 * hm, 24);
  const hy = 30 * n + j - 30;
  return { hy, hm, hd };
}

export function formatHijri(date: Date): string {
  const { hy, hm, hd } = toApproximateHijri(date);
  return `${hd} ${HIJRI_MONTH_NAMES[hm - 1]} ${hy}`;
}

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
