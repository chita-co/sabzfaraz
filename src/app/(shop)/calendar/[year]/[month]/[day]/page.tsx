// src/app/(shop)/calendar/[year]/[month]/[day]/page.tsx
// آدرس قابل‌اشتراک‌گذاری برای یک روز مشخص، مثلاً /calendar/2026/7/15

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getHolidaysInRange } from "@/lib/calendar/holidays";
import { formatJalali, formatHijri } from "@/lib/calendar/jalali";
import CalendarDashboard from "@/components/calendar/CalendarDashboard";

export const dynamic = "force-dynamic";

interface Params { year: string; month: string; day: string }

function parseParams({ year, month, day }: Params): Date | null {
  const y = Number(year), m = Number(month), d = Number(day);
  if (!y || !m || !d || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const date = new Date(y, m - 1, d);
  if (date.getMonth() !== m - 1) return null;
  return date;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const p = await params;
  const date = parseParams(p);
  if (!date) return { title: "تاریخ نامعتبر | سبزفراز" };

  const holidays = getHolidaysInRange(date, date);
  const holidayNames = holidays.map((h) => h.title).join("، ");
  const title = `${formatJalali(date)}${holidayNames ? " — " + holidayNames : ""} | تقویم سبزفراز`;
  const description = `مناسبت‌ها، تعطیلی و رویدادهای ${formatJalali(date)} (${formatHijri(date)} قمری) در تقویم سبزفراز.`;

  return {
    title,
    description,
    alternates: { canonical: `/calendar/${p.year}/${p.month}/${p.day}` },
    openGraph: { title, description, type: "website", locale: "fa_IR" },
  };
}

export default async function CalendarDatePage({ params }: { params: Promise<Params> }) {
  const p = await params;
  const date = parseParams(p);
  if (!date) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div style={{ background: "#14532d" }}>
      <CalendarDashboard isLoggedIn={!!user} initialDate={date} initialView="day" />
    </div>
  );
}
