// src/lib/calendar/storage.ts
//
// حالت مهمان (بدون لاگین): رویدادها و یادداشت‌های روزانه فقط در localStorage
// همان مرورگر ذخیره می‌شوند — هیچ درخواستی به سرور زده نمی‌شود. اگر کاربر
// لاگین باشد، از این فایل اصلاً استفاده نمی‌شود و همه‌چیز از طریق
// /api/calendar/* روی Supabase ذخیره می‌شود.
//
// محدودیت شناخته‌شده: در حال حاضر داده‌ی مهمان بعد از لاگین به‌صورت خودکار به
// حساب کاربری منتقل نمی‌شود (merge نمی‌شود). این یک تصمیم آگاهانه برای
// نگه‌داشتن محدوده‌ی نسخه‌ی اول است؛ در آینده قابل‌اضافه‌شدن است.

import type { CalendarEvent, DayNote } from "@/types/calendar";

const EVENTS_KEY = "sabzfaraz_calendar_events_guest";
const NOTES_KEY = "sabzfaraz_calendar_notes_guest";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function getGuestEvents(): CalendarEvent[] {
  if (typeof window === "undefined") return [];
  return safeParse<CalendarEvent[]>(window.localStorage.getItem(EVENTS_KEY), []);
}

export function saveGuestEvents(events: CalendarEvent[]) {
  window.localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
}

export function addGuestEvent(event: CalendarEvent) {
  const events = getGuestEvents();
  events.push(event);
  saveGuestEvents(events);
}

export function updateGuestEvent(id: string, patch: Partial<CalendarEvent>) {
  const events = getGuestEvents().map((e) => (e.id === id ? { ...e, ...patch } : e));
  saveGuestEvents(events);
}

export function deleteGuestEvent(id: string) {
  saveGuestEvents(getGuestEvents().filter((e) => e.id !== id));
}

export function getGuestNotes(): Record<string, DayNote> {
  if (typeof window === "undefined") return {};
  return safeParse<Record<string, DayNote>>(window.localStorage.getItem(NOTES_KEY), {});
}

export function saveGuestNote(date: string, content: string) {
  const notes = getGuestNotes();
  notes[date] = { date, content, updatedAt: new Date().toISOString() };
  window.localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

export function deleteGuestNote(date: string) {
  const notes = getGuestNotes();
  delete notes[date];
  window.localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

export function makeGuestEventId(): string {
  return `guest-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
