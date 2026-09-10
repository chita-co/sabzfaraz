// src/app/(shop)/calendar/page.tsx
//
// این صفحه داخل گروه (shop) است پس به‌صورت خودکار Header/Footer سایت را می‌گیرد.

import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getHolidaysInRange } from "@/lib/calendar/holidays";
import { formatJalali } from "@/lib/calendar/jalali";
import CalendarDashboard from "@/components/calendar/CalendarDashboard";
import CalendarFaqAccordion from "@/components/calendar/CalendarFaqAccordion";
import { CALENDAR_FAQS } from "@/components/calendar/calendarFaqs";
import GalaxyBackground from "@/components/backgrounds/GalaxyBackground";

// این صفحه به‌خاطر بررسی وضعیت ورود کاربر (cookies) همیشه پویا رندر می‌شود؛
// خودِ داده‌های تقویم (رویدادها) هم جدا و سمت کلاینت از API خوانده می‌شوند.
export const dynamic = "force-dynamic";

const description =
  "تقویم شمسی، میلادی و قمری همراه با تعطیلات رسمی ایران، مناسبت‌های بین‌المللی، امکان ثبت رویداد شخصی، یادآوری، و افزودن به گوگل‌کلندر — رایگان و بدون نیاز به نصب.";

export async function generateMetadata(): Promise<Metadata> {
  const today = new Date();
  const title = `تقویم و رویدادها — ${formatJalali(today, false)} | سبزفراز`;
  return {
    title,
    description,
    alternates: { canonical: "/calendar" },
    openGraph: { title, description, type: "website", locale: "fa_IR" },
    twitter: { card: "summary", title, description },
  };
}

export default async function CalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const today = new Date();
  const rangeStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const rangeEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0);
  const holidays = getHolidaysInRange(rangeStart, rangeEnd);

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://sabzfaraz.ir").replace(/\/$/, "");

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "خانه", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "تقویم و رویدادها", item: `${siteUrl}/calendar` },
    ],
  };

  const eventsSchema = holidays
    .filter((h) => h.isHoliday)
    .slice(0, 15)
    .map((h) => ({
      "@context": "https://schema.org",
      "@type": "Event",
      name: h.title,
      startDate: h.date.toISOString().slice(0, 10),
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      eventStatus: "https://schema.org/EventScheduled",
      location: { "@type": "Country", name: "ایران" },
      organizer: { "@type": "Organization", name: "سبزفراز", url: siteUrl },
    }));

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: CALENDAR_FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="cal-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <GalaxyBackground />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      {eventsSchema.map((s, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
      ))}

      <h1 className="cal-page-h1">تقویم و رویدادها</h1>

      <CalendarDashboard isLoggedIn={!!user} initialDate={today} />

      <CalendarFaqAccordion />

      <style>{`
        .cal-page { background: transparent; position: relative; }
        .cal-page-h1 { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
      `}</style>
    </div>
  );
}
