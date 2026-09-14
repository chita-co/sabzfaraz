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

import { toJalali, toApproximateHijri } from "./jalali";

export interface StaticHoliday {
  title: string;
  isHoliday: boolean; // آیا تعطیل رسمی است یا فقط یک مناسبت (مثل روز پدر)
}

/** کلید: "jm-jd" (ماه-روز شمسی) */
export const IRAN_FIXED_HOLIDAYS: Record<string, StaticHoliday> = {
  "1-1": { title: "جشن نوروز/جشن سال نو", isHoliday: true },
  "1-2": { title: "عیدنوروز", isHoliday: true },
  "1-3": { title: "عیدنوروز", isHoliday: true },
  "1-4": { title: "عیدنوروز", isHoliday: true },
  "1-6": { title: "روز امید، روز شادباش نویسی؛ زادروز اَشو زرتشت", isHoliday: false },
  "1-10": { title: "جشن آبانگاه", isHoliday: false },
  "1-12": { title: "روز جمهوری اسلامی", isHoliday: true },
  "1-13": { title: "جشن سیزده به در", isHoliday: true },
  "1-17": { title: "سروش روز، جشن سروشگان", isHoliday: false },
  "1-19": { title: "فروردین روز، جشن فروردینگان", isHoliday: false },
  "1-23": { title: "روز دندانپزشک", isHoliday: false },
  "1-25": { title: "روز بزرگداشت عطار نیشابوری", isHoliday: false },
  "1-29": { title: "روز ارتش جمهوری اسلامی ایران", isHoliday: false },
  "1-30": { title: "روز علوم آزمایشگاهی، زادروز حکیم سید اسماعیل جرجانی", isHoliday: false },
  "2-1": { title: "روز بزرگداشت سعدی", isHoliday: false },
  "2-3": { title: "روز بزرگداشت شیخ بهایی؛ روز ملی کارآفرینی؛ روز معماری", isHoliday: false },
  "2-9": { title: "روز ملی روانشناس و مشاور", isHoliday: false },
  "2-10": { title: "جشن چهلم نوروز؛ روز ملی خلیج فارس", isHoliday: false },
  "2-12": { title: "روز معلم", isHoliday: false },
  "2-15": { title: "جشن میانه بهار/جشن بهاربد؛ روز شیراز", isHoliday: false },
  "2-22": { title: "زادروز مریم میرزاخانی، روز جهانی زن در ریاضیات", isHoliday: false },
  "2-25": { title: "روز بزرگداشت فردوسی", isHoliday: false },
  "2-27": { title: "روز ارتباطات و روابط عمومی", isHoliday: false },
  "2-28": { title: "روز بزرگداشت حکیم عمر خیام", isHoliday: false },
  "3-1": { title: "روز بهره‌وری و بهینه‌سازی مصرف؛ روز بزرگداشت ملاصدرا", isHoliday: false },
  "3-3": { title: "فتح خرمشهر، روز مقاومت، ایثار و پیروزی", isHoliday: false },
  "3-4": { title: "روز دزفول، روز مقاومت و پایداری", isHoliday: false },
  "3-6": { title: "خرداد روز، جشن خردادگان", isHoliday: false },
  "3-14": { title: "رحلت حضرت امام خمینی", isHoliday: true },
  "3-15": { title: "قیام ۱۵ خرداد", isHoliday: true },
  "3-25": { title: "روز ملی گل و گیاه", isHoliday: false },
  "4-1": { title: "جشن آب‌پاشونک، جشن آغاز تابستان", isHoliday: false },
  "4-7": { title: "روز قوه قضاییه", isHoliday: false },
  "4-8": { title: "روز مبارزه با سلاح‌های شیمیایی و میکروبی", isHoliday: false },
  "4-10": { title: "روز صنعت و معدن؛ زادروز بابک خرمدین؛ روز بزرگداشت صائب تبریزی", isHoliday: false },
  "4-13": { title: "جشن تیرگان", isHoliday: false },
  "4-14": { title: "روز قلم", isHoliday: false },
  "4-22": { title: "زادروز محمد خوارزمی، روز ملی فناوری اطلاعات", isHoliday: false },
  "4-25": { title: "روز بهزیستی و تامین اجتماعی", isHoliday: false },
  "5-7": { title: "اَمرداد روز، جشن اَمردادگان", isHoliday: false },
  "5-8": { title: "روز بزرگداشت شیخ شهاب‌الدین سهروردی", isHoliday: false },
  "5-10": { title: "جشن چله تابستان", isHoliday: false },
  "5-14": { title: "سالروز صدور فرمان مشروطیت", isHoliday: false },
  "5-17": { title: "روز خبرنگار", isHoliday: false },
  "5-28": { title: "سالروز وقایع ۲۸ مرداد؛ فاجعه سینما رکس آبادان", isHoliday: false },
  "6-1": { title: "روز بزرگداشت ابوعلی سینا و روز پزشک", isHoliday: false },
  "6-2": { title: "آغاز هفته دولت", isHoliday: false },
  "6-4": { title: "زادروز کوروش بزرگ؛ شهریور روز، جشن شهریورگان", isHoliday: false },
  "6-5": { title: "روز بزرگداشت محمدبن زکریای رازی و روز داروساز", isHoliday: false },
  "6-8": { title: "روز مبارزه با تروریسم", isHoliday: false },
  "6-11": { title: "روز ملی صنعت چاپ", isHoliday: false },
  "6-13": { title: "روز بزرگداشت ابوریحان بیرونی", isHoliday: false },
  "6-16": { title: "روز دانشجو", isHoliday: false },
  "6-21": { title: "روز سینما", isHoliday: false },
  "6-27": { title: "روز شعر و ادب پارسی، بزرگداشت استاد شهریار", isHoliday: false },
  "6-31": { title: "آغاز هفته دفاع مقدس", isHoliday: false },
  "7-4": { title: "روز گرامیداشت سربازان وطن", isHoliday: false },
  "7-7": { title: "روز آتش‌نشانی و ایمنی؛ روز بزرگداشت شمس تبریزی", isHoliday: false },
  "7-8": { title: "روز بزرگداشت مولوی", isHoliday: false },
  "7-10": { title: "مهر روز، جشن مهرگان", isHoliday: false },
  "7-14": { title: "روز دامپزشکی", isHoliday: false },
  "7-16": { title: "روز ملی کودک", isHoliday: false },
  "7-20": { title: "روز بزرگداشت حافظ", isHoliday: false },
  "7-21": { title: "روز پیروزی کاوه و فریدون بر ضحاک", isHoliday: false },
  "7-26": { title: "روز تربیت بدنی و ورزش", isHoliday: false },
  "7-29": { title: "روز ملی کوهنورد", isHoliday: false },
  "8-1": { title: "روز آمار و برنامه‌ریزی؛ روز بزرگداشت ابوالفضل بیهقی", isHoliday: false },
  "8-8": { title: "روز ملی محیط‌بان", isHoliday: false },
  "8-10": { title: "آبان روز، جشن آبانگان", isHoliday: false },
  "8-14": { title: "روز ملی مازندران", isHoliday: false },
  "8-15": { title: "جشن میانه پاییز", isHoliday: false },
  "8-18": { title: "روز ملی کیفیت", isHoliday: false },
  "8-24": { title: "روز کتاب و کتابخوانی", isHoliday: false },
  "9-1": { title: "آذر جشن", isHoliday: false },
  "9-5": { title: "روز بسیج مستضعفان", isHoliday: false },
  "9-7": { title: "روز نیروی دریایی ارتش", isHoliday: false },
  "9-9": { title: "جشن آذرگان، آذر روز", isHoliday: false },
  "9-13": { title: "روز صنعت بیمه", isHoliday: false },
  "9-15": { title: "روز حسابدار", isHoliday: false },
  "9-25": { title: "روز پژوهش و فناوری", isHoliday: false },
  "9-30": { title: "جشن شب یلدا، شب چلّه", isHoliday: false },
  "10-1": { title: "روز میلاد خورشید؛ نخستین جشن دیگان", isHoliday: false },
  "10-8": { title: "دی به آذر روز، دومین جشن دیگان", isHoliday: false },
  "10-12": { title: "روز حافظ", isHoliday: false },
  "10-15": { title: "دی به مهر روز، سومین جشن دیگان", isHoliday: false },
  "10-23": { title: "دی به دین روز، چهارمین جشن دیگان", isHoliday: false },
  "11-1": { title: "زادروز فردوسی", isHoliday: false },
  "11-2": { title: "بهمن روز، جشن بهمنگان", isHoliday: false },
  "11-6": { title: "بزرگداشت صفی‌الدین اُرموی، روز موسیقی ایرانی", isHoliday: false },
  "11-10": { title: "جشن سده", isHoliday: false },
  "11-12": { title: "بازگشت امام خمینی (ره) به ایران", isHoliday: false },
  "11-15": { title: "جشن میانه زمستان", isHoliday: false },
  "11-19": { title: "روز نیروی هوایی", isHoliday: false },
  "11-22": { title: "پیروزی انقلاب اسلامی", isHoliday: true },
  "11-29": { title: "جشن سپندارمذگان، روز عشق", isHoliday: false },
  "12-5": { title: "روز بزرگداشت خواجه نصیرالدین طوسی و روز مهندس", isHoliday: false },
  "12-7": { title: "روز وکیل مدافع", isHoliday: false },
  "12-15": { title: "روز درختکاری", isHoliday: false },
  "12-25": { title: "پایان سرایش شاهنامه؛ روز بزرگداشت پروین اعتصامی", isHoliday: false },
  "12-29": { title: "روز ملی شدن صنعت نفت ایران", isHoliday: true },
};

/** کلید: "gm-gd" (ماه-روز میلادی) */
export const INTERNATIONAL_OBSERVANCES: Record<string, StaticHoliday> = {
  "1-1": { title: "سال نو میلادی", isHoliday: false },
  "1-24": { title: "روز جهانی آموزش", isHoliday: false },
  "2-4": { title: "روز جهانی سرطان", isHoliday: false },
  "2-14": { title: "روز ولنتاین", isHoliday: false },
  "2-21": { title: "روز جهانی زبان مادری", isHoliday: false },
  "3-8": { title: "روز جهانی زن", isHoliday: false },
  "3-14": { title: "روز جهانی عدد پی π", isHoliday: false },
  "3-20": { title: "روز جهانی شادی", isHoliday: false },
  "3-21": { title: "روز جهانی نوروز (یونسکو)", isHoliday: false },
  "3-23": { title: "روز جهانی هواشناسی", isHoliday: false },
  "3-27": { title: "روز جهانی تئاتر", isHoliday: false },
  "4-2": { title: "روز جهانی آگاهی از اوتیسم", isHoliday: false },
  "4-7": { title: "روز جهانی بهداشت", isHoliday: false },
  "4-22": { title: "روز جهانی زمین", isHoliday: false },
  "4-23": { title: "روز جهانی کتاب", isHoliday: false },
  "4-27": { title: "روز جهانی طراحی و گرافیک", isHoliday: false },
  "5-1": { title: "روز جهانی کارگر", isHoliday: false },
  "5-3": { title: "روز جهانی آزادی مطبوعات", isHoliday: false },
  "5-5": { title: "روز جهانی ماما", isHoliday: false },
  "5-8": { title: "روز جهانی صلیب سرخ و هلال احمر", isHoliday: false },
  "5-12": { title: "روز جهانی پرستار", isHoliday: false },
  "5-15": { title: "روز جهانی خانواده", isHoliday: false },
  "5-18": { title: "روز جهانی موزه و میراث فرهنگی", isHoliday: false },
  "5-31": { title: "روز جهانی بدون دخانیات", isHoliday: false },
  "6-5": { title: "روز جهانی محیط زیست", isHoliday: false },
  "6-8": { title: "روز جهانی اقیانوس‌ها", isHoliday: false },
  "6-10": { title: "روز جهانی صنایع دستی", isHoliday: false },
  "6-12": { title: "روز جهانی مبارزه با کار کودکان", isHoliday: false },
  "6-14": { title: "روز جهانی اهدای خون", isHoliday: false },
  "6-16": { title: "روز جهانی پدر", isHoliday: false },
  "6-17": { title: "روز جهانی بیابان‌زدایی", isHoliday: false },
  "6-20": { title: "روز جهانی پناهندگان", isHoliday: false },
  "6-21": { title: "روز جهانی موسیقی", isHoliday: false },
  "6-26": { title: "روز جهانی مبارزه با مواد مخدر", isHoliday: false },
  "8-1": { title: "آغاز هفته جهانی شیردهی", isHoliday: false },
  "8-13": { title: "روز جهانی چپ‌دست‌ها", isHoliday: false },
  "8-19": { title: "روز جهانی عکاسی", isHoliday: false },
  "9-8": { title: "روز جهانی سواد", isHoliday: false },
  "9-10": { title: "روز جهانی پیشگیری از خودکشی", isHoliday: false },
  "9-21": { title: "روز جهانی صلح", isHoliday: false },
  "9-27": { title: "روز جهانی گردشگری", isHoliday: false },
  "9-30": { title: "روز جهانی ناشنوایان؛ روز جهانی ترجمه و مترجم", isHoliday: false },
  "10-1": { title: "روز جهانی سالمندان", isHoliday: false },
  "10-4": { title: "آغاز هفته جهانی فضا", isHoliday: false },
  "10-5": { title: "روز جهانی معلم", isHoliday: false },
  "10-9": { title: "روز جهانی پست", isHoliday: false },
  "10-10": { title: "روز جهانی مبارزه با حکم اعدام؛ روز جهانی سلامت روان", isHoliday: false },
  "10-11": { title: "روز جهانی دختر", isHoliday: false },
  "10-14": { title: "روز جهانی استاندارد", isHoliday: false },
  "10-15": { title: "روز جهانی عصای سفید", isHoliday: false },
  "10-16": { title: "روز جهانی غذا", isHoliday: false },
  "10-17": { title: "روز جهانی ریشه‌کنی فقر", isHoliday: false },
  "10-24": { title: "روز جهانی سازمان ملل", isHoliday: false },
  "11-14": { title: "روز جهانی دیابت", isHoliday: false },
  "11-16": { title: "روز جهانی بردباری و مدارا", isHoliday: false },
  "11-17": { title: "روز جهانی دانش‌آموز", isHoliday: false },
  "11-19": { title: "روز جهانی آقایان", isHoliday: false },
  "11-20": { title: "روز جهانی کودک", isHoliday: false },
  "11-25": { title: "روز جهانی مبارزه با خشونت علیه زنان", isHoliday: false },
  "12-1": { title: "روز جهانی ایدز", isHoliday: false },
  "12-3": { title: "روز جهانی معلولان", isHoliday: false },
  "12-10": { title: "روز جهانی حقوق بشر", isHoliday: false },
  "12-11": { title: "روز جهانی کوهستان", isHoliday: false },
  "12-25": { title: "کریسمس", isHoliday: false },
};

/** کلید: سال میلادی → آرایه‌ای از {date: "YYYY-MM-DD", title, isHoliday} */
export interface HijriOccasion { hm: number; hd: number; title: string; isHoliday: boolean }

/** کلید: ماه/روز قمری — چون تعطیلات قمری همیشه روی همین روز/ماه ثابتن، این جدول برای هر سالی (گذشته یا آینده) خودکار کار می‌کنه */
export const LUNAR_OCCASIONS: HijriOccasion[] = [
  { hm: 1, hd: 9, title: "تاسوعای حسینی", isHoliday: true },
  { hm: 1, hd: 10, title: "عاشورای حسینی", isHoliday: true },
  { hm: 1, hd: 12, title: "شهادت امام زین العابدین (ع)", isHoliday: false },
  { hm: 2, hd: 20, title: "اربعین حسینی", isHoliday: true },
  { hm: 2, hd: 28, title: "رحلت رسول اکرم و شهادت امام حسن مجتبی (ع)", isHoliday: true },
  { hm: 2, hd: 29, title: "شهادت امام رضا (ع)", isHoliday: true },
  { hm: 3, hd: 1, title: "هجرت پیامبر اکرم از مکه به مدینه", isHoliday: false },
  { hm: 3, hd: 8, title: "شهادت امام حسن عسکری (ع)", isHoliday: false },
  { hm: 3, hd: 12, title: "میلاد رسول اکرم به روایت اهل سنت", isHoliday: false },
  { hm: 3, hd: 17, title: "میلاد رسول اکرم و امام جعفر صادق (ع)", isHoliday: true },
  { hm: 4, hd: 8, title: "ولادت امام حسن عسکری (ع)", isHoliday: false },
  { hm: 4, hd: 10, title: "وفات حضرت معصومه (س)", isHoliday: false },
  { hm: 5, hd: 5, title: "ولادت حضرت زینب (س) و روز پرستار و بهورز", isHoliday: false },
  { hm: 6, hd: 3, title: "شهادت حضرت فاطمه زهرا (س)", isHoliday: true },
  { hm: 6, hd: 20, title: "ولادت حضرت فاطمه زهرا (س) و روز مادر", isHoliday: false },
  { hm: 7, hd: 1, title: "ولادت امام محمد باقر (ع)", isHoliday: false },
  { hm: 7, hd: 3, title: "شهادت امام علی النقی (ع)", isHoliday: false },
  { hm: 7, hd: 10, title: "ولادت امام محمد تقی (ع)", isHoliday: false },
  { hm: 7, hd: 13, title: "ولادت امام علی (ع) و روز پدر", isHoliday: false },
  { hm: 7, hd: 15, title: "وفات حضرت زینب (س)", isHoliday: false },
  { hm: 7, hd: 25, title: "شهادت امام موسی کاظم (ع)", isHoliday: false },
  { hm: 7, hd: 27, title: "مبعث رسول اکرم (ص)", isHoliday: true },
  { hm: 8, hd: 3, title: "ولادت سالار شهیدان، امام حسین (ع) و روز پاسدار", isHoliday: false },
  { hm: 8, hd: 4, title: "ولادت حضرت ابوالفضل العباس (ع) و روز جانباز", isHoliday: false },
  { hm: 8, hd: 5, title: "ولادت امام زین العابدین (ع)", isHoliday: false },
  { hm: 8, hd: 11, title: "ولادت حضرت علی اکبر (ع) و روز جوان", isHoliday: false },
  { hm: 8, hd: 15, title: "ولادت حضرت قائم عجل الله تعالی فرجه و جشن نیمه شعبان", isHoliday: true },
  { hm: 9, hd: 15, title: "ولادت امام حسن مجتبی (ع)", isHoliday: false },
  { hm: 9, hd: 18, title: "شب قدر", isHoliday: false },
  { hm: 9, hd: 19, title: "ضربت خوردن حضرت علی (ع)", isHoliday: false },
  { hm: 9, hd: 21, title: "شهادت حضرت علی (ع)", isHoliday: true },
  { hm: 9, hd: 22, title: "شب قدر", isHoliday: false },
  { hm: 10, hd: 1, title: "عید سعید فطر", isHoliday: true },
  { hm: 10, hd: 2, title: "تعطیل به مناسبت عید سعید فطر", isHoliday: true },
  { hm: 10, hd: 25, title: "شهادت امام جعفر صادق (ع)", isHoliday: false },
  { hm: 11, hd: 1, title: "ولادت حضرت معصومه (س)، روز دختران", isHoliday: false },
  { hm: 11, hd: 11, title: "ولادت امام رضا (ع)", isHoliday: false },
  { hm: 11, hd: 30, title: "شهادت امام محمّد تقی (ع)", isHoliday: false },
  { hm: 12, hd: 7, title: "شهادت امام محمد باقر (ع)", isHoliday: false },
  { hm: 12, hd: 9, title: "روز عرفه", isHoliday: false },
  { hm: 12, hd: 10, title: "عید سعید قربان", isHoliday: true },
  { hm: 12, hd: 15, title: "ولادت امام علی النقی (ع)", isHoliday: false },
  { hm: 12, hd: 18, title: "عید سعید غدیر خم", isHoliday: true },
  { hm: 12, hd: 20, title: "ولادت امام موسی کاظم (ع)", isHoliday: false },
];

export function getIranHolidayForJalali(jm: number, jd: number): StaticHoliday | null {
  return IRAN_FIXED_HOLIDAYS[`${jm}-${jd}`] ?? null;
}

export function getInternationalObservanceForGregorian(gm: number, gd: number): StaticHoliday | null {
  return INTERNATIONAL_OBSERVANCES[`${gm}-${gd}`] ?? null;
}

export function getLunarHolidaysForIsoDate(isoDate: string): { title: string; isHoliday: boolean }[] {
  const date = new Date(`${isoDate}T00:00:00`);
  const { hm, hd } = toApproximateHijri(date);
  return LUNAR_OCCASIONS.filter((o) => o.hm === hm && o.hd === hd);
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
