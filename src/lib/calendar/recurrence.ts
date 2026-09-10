// src/lib/calendar/recurrence.ts
//
// به‌جای ذخیره‌ی چند ردیف برای هر رخداد تکراری، فقط یک قانون ساده (RecurrenceRule)
// روی خودِ رویداد ذخیره می‌شود و این فایل، فقط برای بازه‌ی زمانی قابل‌مشاهده
// (مثلاً یک ماه) رخدادهای واقعی را «باز» می‌کند. سبک، سریع، و بدون داده‌ی تکراری.

import type { CalendarEvent } from "@/types/calendar";

const MAX_OCCURRENCES = 366; // سقف ایمنی برای جلوگیری از حلقه‌ی بی‌پایان

export interface EventOccurrence {
  event: CalendarEvent;
  occurrenceStart: Date;
  occurrenceEnd: Date;
}

function addByFreq(date: Date, freq: string, interval: number): Date {
  const d = new Date(date);
  if (freq === "daily") d.setDate(d.getDate() + interval);
  else if (freq === "weekly") d.setDate(d.getDate() + interval * 7);
  else if (freq === "monthly") d.setMonth(d.getMonth() + interval);
  else if (freq === "yearly") d.setFullYear(d.getFullYear() + interval);
  return d;
}

export function expandEventInRange(event: CalendarEvent, rangeStart: Date, rangeEnd: Date): EventOccurrence[] {
  const start = new Date(event.startAt);
  const end = new Date(event.endAt);
  const durationMs = end.getTime() - start.getTime();

  if (!event.recurrence) {
    if (end >= rangeStart && start <= rangeEnd) {
      return [{ event, occurrenceStart: start, occurrenceEnd: end }];
    }
    return [];
  }

  const { freq, interval, until } = event.recurrence;
  const untilDate = until ? new Date(until) : rangeEnd;
  const effectiveEnd = untilDate < rangeEnd ? untilDate : rangeEnd;

  const occurrences: EventOccurrence[] = [];
  let cursor = new Date(start);
  let count = 0;

  while (cursor <= effectiveEnd && count < MAX_OCCURRENCES) {
    const occStart = new Date(cursor);
    const occEnd = new Date(cursor.getTime() + durationMs);
    if (occEnd >= rangeStart && occStart <= effectiveEnd) {
      occurrences.push({ event, occurrenceStart: occStart, occurrenceEnd: occEnd });
    }
    cursor = addByFreq(cursor, freq, Math.max(1, interval || 1));
    count += 1;
  }

  return occurrences;
}

export function expandEventsInRange(events: CalendarEvent[], rangeStart: Date, rangeEnd: Date): EventOccurrence[] {
  return events.flatMap((e) => expandEventInRange(e, rangeStart, rangeEnd));
}
