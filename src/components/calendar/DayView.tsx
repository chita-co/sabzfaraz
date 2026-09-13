"use client";

import type { CalendarEvent } from "@/types/calendar";
import { toJalali, toApproximateHijri, JALALI_MONTH_NAMES, HIJRI_MONTH_NAMES, WEEKDAY_NAMES_FA, toIsoDate } from "@/lib/calendar/jalali";
import { getHolidaysInRange } from "@/lib/calendar/holidays";
import { expandEventsInRange } from "@/lib/calendar/recurrence";
import { MONTH_ACCENT_COLORS } from "@/lib/calendar/monthColors";
import { CalendarClock, Sparkles } from "lucide-react";

export default function DayView({
  currentDate, events, onSlotClick, onEventClick,
}: {
  currentDate: Date;
  events: CalendarEvent[];
  onSlotClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}) {
  const { jy, jm, jd } = toJalali(currentDate);
  const { hy, hm, hd } = toApproximateHijri(currentDate);
  const accent = MONTH_ACCENT_COLORS[jm - 1];
  const isFriday = currentDate.getDay() === 5;

  const dayStart = new Date(currentDate); dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(currentDate); dayEnd.setHours(23, 59, 59, 999);
  const occurrences = expandEventsInRange(events, dayStart, dayEnd);
  const dayIso = toIsoDate(currentDate);
  const personalEvents = occurrences
    .filter((o) => !o.event.isHoliday && toIsoDate(o.occurrenceStart) <= dayIso && toIsoDate(o.occurrenceEnd) >= dayIso)
    .map((o) => o.event)
    .sort((a, b) => (a.allDay === b.allDay ? new Date(a.startAt).getTime() - new Date(b.startAt).getTime() : a.allDay ? -1 : 1));

  const occasions = getHolidaysInRange(currentDate, currentDate);

  return (
    <div className="dv-wrap" style={{ ["--dv-accent" as string]: accent }}>
      <div className="dv-hero">
        <div className="dv-hero-weekday">
          {WEEKDAY_NAMES_FA[currentDate.getDay()]}
          {isFriday && <span className="dv-friday-tag">تعطیل</span>}
        </div>
        <div className="dv-hero-main">
          <span className="dv-hero-num">{jd.toLocaleString("fa-IR")}</span>
          <span className="dv-hero-month">{JALALI_MONTH_NAMES[jm - 1]} {jy.toLocaleString("fa-IR")}</span>
        </div>
        <div className="dv-hero-sub">
          <span>{currentDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
          <span className="dv-dot">•</span>
          <span>{hd} {HIJRI_MONTH_NAMES[hm - 1]} {hy.toLocaleString("fa-IR")} ق</span>
        </div>
      </div>

      {occasions.length > 0 && (
        <div className="dv-occasions">
          <div className="dv-section-title"><Sparkles size={14} /> مناسبت‌های امروز</div>
          <div className="dv-occasions-list">
            {occasions.map((o, i) => (
              <span key={i} className={`dv-occasion-chip ${o.isHoliday ? "holiday" : ""}`}>{o.title}</span>
            ))}
          </div>
        </div>
      )}

      <div className="dv-events-section">
        <div className="dv-section-title"><CalendarClock size={14} /> رویدادهای شما</div>
        {personalEvents.length === 0 ? (
          <button className="dv-empty-add" onClick={() => onSlotClick(currentDate)}>+ برای این روز رویداد اضافه کن</button>
        ) : (
          <div className="dv-events-list">
            {personalEvents.map((ev) => (
              <div key={ev.id} className="dv-event-row" style={{ borderInlineStartColor: ev.color }} onClick={() => onEventClick(ev)}>
                <span className="dv-event-time">{ev.allDay ? "تمام روز" : new Date(ev.startAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}</span>
                <span className="dv-event-title" style={{ color: ev.color }}>{ev.title}</span>
              </div>
            ))}
            <button className="dv-add-more" onClick={() => onSlotClick(currentDate)}>+ رویداد دیگر برای امروز</button>
          </div>
        )}
      </div>

      <style jsx>{`
        .dv-wrap { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1); border-radius: 22px; padding: 24px; display: flex; flex-direction: column; gap: 22px; }
        .dv-hero { text-align: center; padding-bottom: 20px; border-bottom: 1px dashed rgba(255,255,255,.12); }
        .dv-hero-weekday { font-size: 13px; color: var(--dv-accent); font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .dv-friday-tag { background: rgba(248,113,113,.15); color: #f87171; font-size: 10px; padding: 1px 8px; border-radius: 999px; }
        .dv-hero-main { margin-top: 10px; display: flex; align-items: baseline; justify-content: center; gap: 10px; flex-wrap: wrap; }
        .dv-hero-num { font-size: 56px; font-weight: 900; color: #fff; line-height: 1; text-shadow: 0 0 28px var(--dv-accent); }
        .dv-hero-month { font-size: 18px; font-weight: 700; color: var(--dv-accent); }
        .dv-hero-sub { margin-top: 8px; font-size: 12px; color: #9ca3af; display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap; }
        .dv-dot { opacity: .5; }
        .dv-section-title { font-size: 12.5px; font-weight: 800; color: #e5e7eb; display: flex; align-items: center; gap: 6px; margin-bottom: 10px; }
        .dv-occasions-list { display: flex; flex-wrap: wrap; gap: 6px; }
        .dv-occasion-chip { font-size: 11px; padding: 5px 12px; border-radius: 999px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12); color: #d1d5db; }
        .dv-occasion-chip.holiday { background: rgba(248,113,113,.12); border-color: rgba(248,113,113,.4); color: #f87171; }
        .dv-events-list { display: flex; flex-direction: column; gap: 7px; }
        .dv-event-row { display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08); border-inline-start: 3px solid; border-radius: 10px; padding: 9px 12px; cursor: pointer; transition: background .15s; }
        .dv-event-row:hover { background: rgba(255,255,255,.07); }
        .dv-event-time { font-size: 10.5px; color: #9ca3af; min-width: 46px; }
        .dv-event-title { font-size: 12.5px; font-weight: 700; }
        .dv-empty-add, .dv-add-more { background: none; border: 1px dashed rgba(255,255,255,.2); color: #9ca3af; border-radius: 10px; padding: 10px; font-size: 12px; cursor: pointer; text-align: center; width: 100%; transition: border-color .15s, color .15s; }
        .dv-empty-add:hover, .dv-add-more:hover { border-color: var(--dv-accent); color: var(--dv-accent); }
      `}</style>
    </div>
  );
}