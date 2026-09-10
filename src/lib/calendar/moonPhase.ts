// src/lib/calendar/moonPhase.ts
//
// محاسبه‌ی ساده و بدون‌API فاز ماه (نه «قمر در عقرب» که نیاز به موقعیت دقیق
// نجومی زودیاک دارد و از حوصله‌ی این صفحه خارج است — این‌جا فقط فاز/درصد
// روشنایی ماه که با یک فرمول شناخته‌شده و آفلاین قابل‌محاسبه است).

const SYNODIC_MONTH = 29.530588853;
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14); // یک نو-ماه مرجع شناخته‌شده

export interface MoonPhaseInfo {
  age: number; // روز از آخرین نوماه (۰ تا ~۲۹.۵)
  illumination: number; // درصد روشنایی ۰ تا ۱۰۰
  phaseName: string;
  emoji: string;
}

export function getMoonPhase(date: Date): MoonPhaseInfo {
  const days = (date.getTime() - KNOWN_NEW_MOON) / 86400000;
  const age = ((days % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;
  const illumination = Math.round((1 - Math.cos((2 * Math.PI * age) / SYNODIC_MONTH)) * 50);

  let phaseName = "ماه نو";
  let emoji = "🌑";
  if (age < 1.84) { phaseName = "ماه نو"; emoji = "🌑"; }
  else if (age < 5.53) { phaseName = "هلال رو به رشد"; emoji = "🌒"; }
  else if (age < 9.22) { phaseName = "تربیع اول"; emoji = "🌓"; }
  else if (age < 12.91) { phaseName = "أحدب رو به رشد"; emoji = "🌔"; }
  else if (age < 16.61) { phaseName = "ماه کامل (بدر)"; emoji = "🌕"; }
  else if (age < 20.30) { phaseName = "أحدب رو به کاهش"; emoji = "🌖"; }
  else if (age < 23.99) { phaseName = "تربیع آخر"; emoji = "🌗"; }
  else if (age < 27.68) { phaseName = "هلال رو به کاهش"; emoji = "🌘"; }
  else { phaseName = "ماه نو"; emoji = "🌑"; }

  return { age, illumination, phaseName, emoji };
}
