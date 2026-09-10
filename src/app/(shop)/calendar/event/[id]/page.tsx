// src/app/(shop)/calendar/event/[id]/page.tsx
// لینک اشتراک‌گذاری یک رویداد مشخص، مثلاً /calendar/event/8f2c...
// با Service Role خوانده می‌شود (طبق طراحی امنیتی توضیح‌داده‌شده در supabase_calendar.sql)
// چون فقط با داشتن UUID غیرقابل‌حدس رویداد، قابل مشاهده است.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatJalali } from "@/lib/calendar/jalali";
import { buildGoogleCalendarUrl } from "@/lib/calendar/ics";
import { CATEGORY_LABELS } from "@/types/calendar";
import EventShareActions from "@/components/calendar/EventShareActions";
import type { CalendarEvent } from "@/types/calendar";

export const dynamic = "force-dynamic";

function rowToEvent(row: Record<string, unknown>): CalendarEvent {
  return {
    id: row.id as string,
    userId: row.user_id as string | null,
    title: row.title as string,
    description: row.description as string | null,
    category: row.category as CalendarEvent["category"],
    color: row.color as string,
    location: row.location as string | null,
    url: row.url as string | null,
    startAt: row.start_at as string,
    endAt: row.end_at as string,
    allDay: row.all_day as boolean,
    remindersMinutes: (row.reminders_minutes as number[]) ?? [],
    isHoliday: row.is_holiday as boolean,
  };
}

async function getEvent(id: string): Promise<CalendarEvent | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const admin = createAdminClient();
  const { data } = await admin.from("calendar_events").select("*").eq("id", id).single();
  return data ? rowToEvent(data) : null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) return { title: "رویداد یافت نشد | سبزفراز" };

  const title = `${event.title} — ${formatJalali(new Date(event.startAt))} | تقویم سبزفراز`;
  const description = event.description || `رویداد ${event.title} در تقویم سبزفراز`;

  return {
    title,
    description,
    openGraph: { title, description, type: "website", locale: "fa_IR" },
    twitter: { card: "summary", title, description },
  };
}

export default async function EventSharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://sabzfaraz.ir").replace(/\/$/, "");
  const eventSchema = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description || event.title,
    startDate: event.startAt,
    endDate: event.endAt,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: event.location ? { "@type": "Place", name: event.location } : { "@type": "VirtualLocation", url: `${siteUrl}/calendar` },
    organizer: { "@type": "Organization", name: "سبزفراز", url: siteUrl },
  };

  return (
    <div className="esp-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSchema) }} />

      <div className="esp-card">
        <span className="esp-category" style={{ background: `${event.color}22`, color: event.color, borderColor: `${event.color}55` }}>
          {CATEGORY_LABELS[event.category]}
        </span>
        <h1>{event.title}</h1>
        <div className="esp-meta">
          <CalendarDays size={15} /> <time dateTime={event.startAt}>{formatJalali(new Date(event.startAt))}</time>
        </div>
        {event.location && (
          <div className="esp-meta">
            <MapPin size={15} /> {event.location}
          </div>
        )}
        {event.description && <p className="esp-desc">{event.description}</p>}

        <div className="esp-actions">
          <a className="esp-google" href={buildGoogleCalendarUrl(event)} target="_blank" rel="noopener noreferrer">
            افزودن به گوگل‌کلندر
          </a>
          <EventShareActions event={event} />
        </div>

        <Link href="/calendar" className="esp-back">← بازگشت به تقویم</Link>
      </div>

      <style>{`
        .esp-page { min-height: 70vh; background: linear-gradient(135deg, #0f2818 0%, #14532d 45%, #1a4d2e 75%, #3f3010 100%); display: flex; align-items: center; justify-content: center; padding: 40px 16px; }
        .esp-card { background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); border-radius: 20px; padding: 28px; max-width: 480px; width: 100%; }
        .esp-category { display: inline-block; font-size: 11.5px; font-weight: 700; padding: 4px 12px; border-radius: 999px; border: 1px solid; margin-bottom: 12px; }
        .esp-card h1 { font-size: 22px; font-weight: 900; color: #fff; margin: 0 0 14px; }
        .esp-meta { display: flex; align-items: center; gap: 8px; color: #d1d5db; font-size: 13px; margin-bottom: 8px; }
        .esp-desc { color: #e5e7eb; font-size: 13.5px; line-height: 1.9; margin: 14px 0; }
        .esp-actions { display: flex; flex-direction: column; gap: 10px; margin: 20px 0 10px; }
        .esp-google { text-align: center; background: linear-gradient(135deg, #16a34a, #ca8a04); color: #fff; border-radius: 10px; padding: 10px; font-size: 13px; font-weight: 800; text-decoration: none; }
        .esp-back { color: #fbbf24; font-size: 12.5px; text-decoration: none; }
      `}</style>
    </div>
  );
}
