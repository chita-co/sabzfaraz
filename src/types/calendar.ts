// src/types/calendar.ts

export type EventCategory = "personal" | "work" | "birthday" | "meeting" | "reminder" | "holiday" | "other";

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  personal: "شخصی",
  work: "کاری",
  birthday: "تولد",
  meeting: "جلسه",
  reminder: "یادآوری",
  holiday: "تعطیل رسمی",
  other: "سایر",
};

export const CATEGORY_COLORS: Record<EventCategory, string> = {
  personal: "#16a34a",
  work: "#2563eb",
  birthday: "#db2777",
  meeting: "#7c3aed",
  reminder: "#ea580c",
  holiday: "#dc2626",
  other: "#64748b",
};

export type RecurrenceFreq = "daily" | "weekly" | "monthly" | "yearly";

export interface RecurrenceRule {
  freq: RecurrenceFreq;
  interval: number; // هر چند واحد یک‌بار تکرار شود (مثلاً هر ۲ هفته)
  until?: string; // ISO date - تاریخ پایان تکرار
  byweekday?: number[]; // فقط برای weekly: 0=یکشنبه ... 6=شنبه
}

export interface CalendarEvent {
  id: string;
  userId: string | null;
  title: string;
  description?: string | null;
  category: EventCategory;
  color: string;
  location?: string | null;
  url?: string | null;
  startAt: string; // ISO
  endAt: string; // ISO
  allDay: boolean;
  recurrence?: RecurrenceRule | null;
  remindersMinutes: number[];
  isHoliday: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DayNote {
  date: string; // YYYY-MM-DD (شمسی یا میلادی — همیشه بر اساس تاریخ میلادی ذخیره می‌شود)
  content: string;
  updatedAt?: string;
}

export type CalendarViewMode = "month" | "week" | "day" | "year";

export interface JalaliDate {
  jy: number;
  jm: number; // 1-12
  jd: number;
}
