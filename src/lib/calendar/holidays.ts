// src/lib/calendar/holidays.ts
//
// دیتاست تعطیلات و مناسبت‌ها — کاملاً به‌صورت کد و آفلاین (بدون هیچ API
// بیرونی)، چون این‌جور تاریخ‌ها به‌ندرت تغییر می‌کنند و نگه‌داری‌شان به‌صورت
// فایل آسان‌تر و بی‌ریسک‌تر از یک منبع خارجی است.
//
// سه دسته:
//  ۱. IRAN_FIXED_HOLIDAYS: تعطیلات رسمی با روز/ماه شمسی ثابت — هرسال بدون
//     نیاز به تغییر، خودکار محاسبه می‌شوند.
//  ۲. INTERNATIONAL_OBSERVANCES: مناسبت‌های بین‌المللی با روز/ماه میلادی ثابت.
//  ۳. LUNAR_HOLIDAYS_BY_YEAR: مناسبت‌های قمری (عید فطر، تاسوعا/عاشورا، غدیر و
//     ...) که چون هرسال در تاریخ میلادی/شمسی متفاوتی می‌افتند، به‌صورت
//     سال‌به‌سال نگه‌داری می‌شوند. ⚠️ این تاریخ‌ها بر پایه‌ی تقویم قمری محاسباتی
//     تخمین زده شده‌اند و ممکن است با اعلام رسمی رؤیت هلال یک روز اختلاف
//     داشته باشند؛ اگر برای سال جدید نیاز به افزودن داشتید، همین‌جا اضافه کنید.

import { toJalali } from "./jalali";

export interface StaticHoliday {
  title: string;
  isHoliday: boolean; // آیا تعطیل رسمی است یا فقط یک مناسبت (مثل روز پدر)
}

/** کلید: "jm-jd" (ماه-روز شمسی) */
export const IRAN_FIXED_HOLIDAYS: Record<string, StaticHoliday> = {
  "1-1": { title: "جشن نوروز", isHoliday: true },
  "1-2": { title: "جشن نوروز", isHoliday: true },
  "1-3": { title: "جشن نوروز", isHoliday: true },
  "1-4": { title: "جشن نوروز", isHoliday: true },
  "1-12": { title: "روز جمهوری اسلامی ایران", isHoliday: true },
  "1-13": { title: "روز طبیعت (سیزده‌به‌در)", isHoliday: true },
  "3-14": { title: "رحلت امام خمینی (ره)", isHoliday: true },
  "3-15": { title: "قیام ۱۵ خرداد", isHoliday: true },
  "11-22": { title: "پیروزی انقلاب اسلامی", isHoliday: true },
  "12-29": { title: "روز ملی شدن صنعت نفت", isHoliday: true },
  // مناسبت‌های غیرتعطیل پرکاربرد
  "2-25": { title: "روز بزرگداشت فردوسی", isHoliday: false },
  "9-1": { title: "شب یلدا (نزدیک‌ترین شب سال)", isHoliday: false },
};

/** کلید: "gm-gd" (ماه-روز میلادی) */
export const INTERNATIONAL_OBSERVANCES: Record<string, StaticHoliday> = {
  "1-1": { title: "سال نو میلادی", isHoliday: false },
  "2-14": { title: "روز ولنتاین", isHoliday: false },
  "3-8": { title: "روز جهانی زن", isHoliday: false },
  "3-20": { title: "روز جهانی شادی", isHoliday: false },
  "3-21": { title: "روز جهانی نوروز (یونسکو)", isHoliday: false },
  "4-7": { title: "روز جهانی بهداشت", isHoliday: false },
  "4-22": { title: "روز جهانی زمین", isHoliday: false },
  "5-1": { title: "روز جهانی کارگر", isHoliday: false },
  "6-5": { title: "روز جهانی محیط زیست", isHoliday: false },
  "10-1": { title: "روز جهانی سالمندان", isHoliday: false },
  "10-5": { title: "روز جهانی معلم", isHoliday: false },
  "11-16": { title: "روز جهانی بردباری و مدارا", isHoliday: false },
  "12-10": { title: "روز جهانی حقوق بشر", isHoliday: false },
  "12-25": { title: "کریسمس", isHoliday: false },
};

/** کلید: سال میلادی → آرایه‌ای از {date: "YYYY-MM-DD", title, isHoliday} */
export const LUNAR_HOLIDAYS_BY_YEAR: Record<number, { date: string; title: string; isHoliday: boolean }[]> = {
  2026: [
    { date: "2026-01-19", title: "شهادت حضرت فاطمه زهرا (س)", isHoliday: true },
    { date: "2026-01-27", title: "تاسوعای حسینی", isHoliday: true },
    { date: "2026-01-28", title: "عاشورای حسینی", isHoliday: true },
    { date: "2026-03-08", title: "اربعین حسینی", isHoliday: true },
    { date: "2026-03-16", title: "رحلت پیامبر (ص) و شهادت امام حسن (ع)", isHoliday: true },
    { date: "2026-03-18", title: "شهادت امام رضا (ع)", isHoliday: true },
    { date: "2026-08-16", title: "عید سعید فطر", isHoliday: true },
    { date: "2026-10-23", title: "عید سعید قربان", isHoliday: true },
    { date: "2026-10-31", title: "عید سعید غدیر خم", isHoliday: true },
  ],
};

export function getIranHolidayForJalali(jm: number, jd: number): StaticHoliday | null {
  return IRAN_FIXED_HOLIDAYS[`${jm}-${jd}`] ?? null;
}

export function getInternationalObservanceForGregorian(gm: number, gd: number): StaticHoliday | null {
  return INTERNATIONAL_OBSERVANCES[`${gm}-${gd}`] ?? null;
}

export function getLunarHolidaysForIsoDate(isoDate: string): { title: string; isHoliday: boolean }[] {
  const year = Number(isoDate.slice(0, 4));
  return (LUNAR_HOLIDAYS_BY_YEAR[year] ?? []).filter((h) => h.date === isoDate);
}

/**
 * لیست تخت و مرتب‌شده‌ی همه‌ی تعطیلات/مناسبت‌ها بین دو تاریخ میلادی — برای
 * فیدهای RSS/iCal و برای نمای سالانه‌ی تقویم استفاده می‌شود.
 */
export function getHolidaysInRange(
  rangeStart: Date,
  rangeEnd: Date
): { date: Date; title: string; isHoliday: boolean }[] {
  const results: { date: Date; title: string; isHoliday: boolean }[] = [];
  const cursor = new Date(rangeStart);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(rangeEnd);
  end.setHours(0, 0, 0, 0);

  while (cursor <= end) {
    const gm = cursor.getMonth() + 1;
    const gd = cursor.getDate();
    const iso = `${cursor.getFullYear()}-${String(gm).padStart(2, "0")}-${String(gd).padStart(2, "0")}`;

    const intl = getInternationalObservanceForGregorian(gm, gd);
    if (intl) results.push({ date: new Date(cursor), title: intl.title, isHoliday: intl.isHoliday });

    const { jm, jd } = toJalali(cursor);
    const iranHoliday = getIranHolidayForJalali(jm, jd);
    if (iranHoliday) results.push({ date: new Date(cursor), title: iranHoliday.title, isHoliday: iranHoliday.isHoliday });

    for (const lunar of getLunarHolidaysForIsoDate(iso)) {
      results.push({ date: new Date(cursor), title: lunar.title, isHoliday: lunar.isHoliday });
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return results;
}
