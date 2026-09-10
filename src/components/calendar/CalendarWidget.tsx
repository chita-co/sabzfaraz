"use client";

// ویجت کوچک تقویم برای صفحات دیگر سایت (مثلاً صفحه‌ی اصلی) — اختیاری، در هیچ
// صفحه‌ای به‌طور پیش‌فرض import نشده. طبق INTEGRATION.md قابل‌فعال‌سازی است.

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatJalali } from "@/lib/calendar/jalali";
import { getHolidaysInRange } from "@/lib/calendar/holidays";

export default function CalendarWidget() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setNow(new Date()), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!now) return null;

  const todayHolidays = getHolidaysInRange(now, now);

  return (
     <Link href="/calendar" className="cw-wrap">
      <span className="cw-date">{formatJalali(now)}</span>
      {todayHolidays.length > 0 && (
        <span className="cw-holiday">· {todayHolidays.map((h) => h.title).join("، ")}</span>
      )}
      <span className="cw-cta">مشاهده‌ی تقویم و رویدادها ←</span>

      <style jsx>{`
        .cw-wrap { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; text-decoration: none; }
.cw-date { color: #fff; font-size: 12.5px; font-weight: 700; white-space: nowrap; }
.cw-holiday { color: #fbbf24; font-size: 11.5px; white-space: nowrap; }
.cw-cta { color: #d1d5db; font-size: 11.5px; white-space: nowrap; }
      `}</style>
    </Link>
  );
}
