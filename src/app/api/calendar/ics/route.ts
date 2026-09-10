// src/app/api/calendar/ics/route.ts
// فید عمومی iCal تعطیلات/مناسبت‌ها — کاربران می‌توانند این URL را در گوگل
// کلندر/اپل کلندر «Subscribe» کنند. کاملاً از دیتاست کدی holidays.ts ساخته
// می‌شود، هیچ کوئری به Supabase نمی‌زند.

import { NextResponse } from "next/server";
import { getHolidaysInRange } from "@/lib/calendar/holidays";

export const runtime = "nodejs";
export const revalidate = 86400; // یک‌بار در روز کافی است، این داده‌ها به‌ندرت تغییر می‌کنند

function toIcsDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

export async function GET() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear() + 1, now.getMonth(), 0);
  const holidays = getHolidaysInRange(start, end);

  const events = holidays
    .map((h, i) => {
      const dt = toIcsDate(h.date);
      const nextDay = new Date(h.date);
      nextDay.setDate(nextDay.getDate() + 1);
      return [
        "BEGIN:VEVENT",
        `UID:holiday-${dt}-${i}@sabzfaraz.ir`,
        `DTSTAMP:${toIcsDate(now)}T000000Z`,
        `DTSTART;VALUE=DATE:${dt}`,
        `DTEND;VALUE=DATE:${toIcsDate(nextDay)}`,
        `SUMMARY:${h.title}${h.isHoliday ? " (تعطیل)" : ""}`,
        "END:VEVENT",
      ].join("\r\n");
    })
    .join("\r\n");

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Sabzfaraz//Calendar//FA",
    "X-WR-CALNAME:تعطیلات و مناسبت‌ها - سبزفراز",
    "CALSCALE:GREGORIAN",
    events,
    "END:VCALENDAR",
  ].join("\r\n");

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": "inline; filename=sabzfaraz-holidays.ics",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
