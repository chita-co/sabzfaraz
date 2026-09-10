// src/app/api/calendar/rss/route.ts
import { NextResponse } from "next/server";
import { getHolidaysInRange } from "@/lib/calendar/holidays";

export const runtime = "nodejs";
export const revalidate = 86400;

function escapeXml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function GET() {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://sabzfaraz.ir").replace(/\/$/, "");
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth() + 6, 0);
  const holidays = getHolidaysInRange(now, end).filter((h) => h.date >= now);

  const items = holidays
    .map(
      (h) => `
    <item>
      <title>${escapeXml(h.title)}</title>
      <link>${siteUrl}/calendar/${h.date.getFullYear()}/${h.date.getMonth() + 1}/${h.date.getDate()}</link>
      <guid isPermaLink="false">holiday-${h.date.toISOString().slice(0, 10)}-${escapeXml(h.title)}</guid>
      <pubDate>${h.date.toUTCString()}</pubDate>
      <description>${escapeXml(h.title)}${h.isHoliday ? " (تعطیل رسمی)" : ""}</description>
    </item>`
    )
    .join("");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>تقویم و رویدادهای سبزفراز</title>
    <link>${siteUrl}/calendar</link>
    <description>تعطیلات رسمی و مناسبت‌های پیش‌رو</description>
    <language>fa-ir</language>${items}
  </channel>
</rss>`;

  return new NextResponse(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
