// src/lib/calendar/ics.ts

import type { CalendarEvent } from "@/types/calendar";

function toIcsDate(iso: string, allDay: boolean): string {
  const d = new Date(iso);
  if (allDay) {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}${m}${day}`;
  }
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escapeIcsText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function buildIcsForEvent(event: CalendarEvent, siteUrl: string): string {
  const dtStart = toIcsDate(event.startAt, event.allDay);
  const dtEnd = toIcsDate(event.endAt, event.allDay);
  const dateLine = event.allDay
    ? `DTSTART;VALUE=DATE:${dtStart}\nDTEND;VALUE=DATE:${dtEnd}`
    : `DTSTART:${dtStart}\nDTEND:${dtEnd}`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Sabzfaraz//Calendar//FA",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${event.id}@sabzfaraz.ir`,
    `DTSTAMP:${toIcsDate(new Date().toISOString(), false)}`,
    dateLine,
    `SUMMARY:${escapeIcsText(event.title)}`,
    event.description ? `DESCRIPTION:${escapeIcsText(event.description)}` : "",
    event.location ? `LOCATION:${escapeIcsText(event.location)}` : "",
    `URL:${siteUrl}/calendar/event/${event.id}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

export function buildIcsFeed(events: CalendarEvent[], siteUrl: string, calendarName = "تقویم سبزفراز"): string {
  const body = events
    .map((event) => {
      const dtStart = toIcsDate(event.startAt, event.allDay);
      const dtEnd = toIcsDate(event.endAt, event.allDay);
      const dateLine = event.allDay
        ? `DTSTART;VALUE=DATE:${dtStart}\nDTEND;VALUE=DATE:${dtEnd}`
        : `DTSTART:${dtStart}\nDTEND:${dtEnd}`;
      return [
        "BEGIN:VEVENT",
        `UID:${event.id}@sabzfaraz.ir`,
        `DTSTAMP:${toIcsDate(new Date().toISOString(), false)}`,
        dateLine,
        `SUMMARY:${escapeIcsText(event.title)}`,
        event.description ? `DESCRIPTION:${escapeIcsText(event.description)}` : "",
        `URL:${siteUrl}/calendar/event/${event.id}`,
        "END:VEVENT",
      ]
        .filter(Boolean)
        .join("\r\n");
    })
    .join("\r\n");

  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Sabzfaraz//Calendar//FA", `X-WR-CALNAME:${calendarName}`, "CALSCALE:GREGORIAN", body, "END:VCALENDAR"].join("\r\n");
}

export function downloadIcsFile(event: CalendarEvent, siteUrl: string) {
  const ics = buildIcsForEvent(event, siteUrl);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.title.replace(/[^\w\u0600-\u06FF]+/g, "-")}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export function buildGoogleCalendarUrl(event: CalendarEvent): string {
  const fmt = (iso: string) => toIcsDate(iso, event.allDay);
  const dates = `${fmt(event.startAt)}/${fmt(event.endAt)}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates,
    details: event.description || "",
    location: event.location || "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
