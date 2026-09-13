"use client";

import type { CalendarEvent } from "@/types/calendar";
import { toJalali, toIsoDate, JALALI_MONTH_NAMES } from "@/lib/calendar/jalali";
import { expandEventsInRange } from "@/lib/calendar/recurrence";
import { MONTH_ACCENT_COLORS } from "@/lib/calendar/monthColors";

const WEEKDAY_NAMES_SAT_FIRST = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];

function getWeekDaysSatFirst(date: Date): Date[] {
  const start = new Date(date);
  const diffToSat = (date.getDay() + 1) % 7;
  start.setDate(date.getDate() - diffToSat);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export default function WeekView({
  currentDate, events, onSlotClick, onEventClick,
}: {
  currentDate: Date;
  events: CalendarEvent[];
  onSlotClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}) {
  const days = getWeekDaysSatFirst(currentDate);
  const rangeStart = new Date(days[0]); rangeStart.setHours(0, 0, 0, 0);
  const rangeEnd = new Date(days[6]); rangeEnd.setHours(23, 59, 59, 999);
  const occurrences = expandEventsInRange(events, rangeStart, rangeEnd);
  const todayIso = toIsoDate(new Date());

  function eventsForDay(day: Date) {
    const iso = toIsoDate(day);
    return occurrences.filter((o) => toIsoDate(o.occurrenceStart) <= iso && toIsoDate(o.occurrenceEnd) >= iso).map((o) => o.event);
  }

  return (
    <div className="wv-wrap">
      <div className="wv-grid">
        {days.map((d, i) => {
          const iso = toIsoDate(d);
          const { jm, jd } = toJalali(d);
          const accent = MONTH_ACCENT_COLORS[jm - 1];
          const isToday = iso === todayIso;
          const isFriday = d.getDay() === 5;
          const dayEvents = eventsForDay(d);

          return (
            <div key={iso} className={`wv-day ${isToday ? "today" : ""} ${isFriday ? "friday" : ""}`} style={{ ["--wv-accent" as string]: accent }} onClick={() => onSlotClick(d)}>
              <div className="wv-day-head">
                <span className="wv-weekday">{WEEKDAY_NAMES_SAT_FIRST[i]}</span>
                {isToday ? <span className="wv-daynum-badge">{jd.toLocaleString("fa-IR")}</span> : <span className="wv-daynum">{jd.toLocaleString("fa-IR")}</span>}
                <span className="wv-month-tag">{JALALI_MONTH_NAMES[jm - 1]}</span>
              </div>
              <div className="wv-events">
                {dayEvents.length === 0 && <span className="wv-empty">رویدادی نیست</span>}
                {dayEvents.map((ev) => (
                  <div key={ev.id} className="wv-event" style={{ background: `${ev.color}22`, color: ev.color, borderColor: `${ev.color}55` }} onClick={(e) => { e.stopPropagation(); onEventClick(ev); }} title={ev.title}>
                    {!ev.allDay && <span className="wv-event-time">{new Date(ev.startAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}</span>}
                    <span className="wv-event-title">{ev.title}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .wv-wrap { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1); border-radius: 20px; overflow: hidden; padding: 14px; }
        .wv-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; }
        @media (max-width: 900px) { .wv-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 480px) { .wv-grid { grid-template-columns: 1fr; } }
        .wv-day { background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.08); border-top: 3px solid var(--wv-accent); border-radius: 14px; padding: 10px; cursor: pointer; min-height: 160px; transition: background .15s, transform .15s; }
        .wv-day:hover { background: rgba(255,255,255,.06); transform: translateY(-2px); }
        .wv-day.friday { border-top-color: #f87171; }
        .wv-day.today { background: linear-gradient(160deg, var(--wv-accent) -110%, rgba(255,255,255,.06) 45%); box-shadow: 0 0 0 1.5px var(--wv-accent), 0 8px 18px -8px var(--wv-accent); }
        .wv-day-head { display: flex; flex-direction: column; align-items: center; gap: 4px; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px dashed rgba(255,255,255,.1); }
        .wv-weekday { font-size: 11.5px; color: #9ca3af; font-weight: 700; }
        .wv-day.friday .wv-weekday { color: #f87171; }
        .wv-daynum { font-size: 20px; font-weight: 900; color: #e5e7eb; }
        .wv-daynum-badge { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 999px; background: var(--wv-accent); color: #0f2818; font-size: 16px; font-weight: 900; box-shadow: 0 0 14px -2px var(--wv-accent); animation: cal-pulse 2.4s ease-in-out infinite; }
        .wv-month-tag { font-size: 9.5px; color: var(--wv-accent); font-weight: 700; }
        .wv-events { display: flex; flex-direction: column; gap: 5px; }
        .wv-empty { font-size: 10px; color: #6b7280; text-align: center; display: block; padding: 8px 0; }
        .wv-event { font-size: 10.5px; padding: 4px 7px; border-radius: 8px; border: 1px solid; display: flex; flex-direction: column; gap: 1px; cursor: pointer; overflow: hidden; }
        .wv-event-time { font-size: 9px; opacity: .8; direction: ltr; text-align: right; }
        .wv-event-title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        @keyframes cal-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(251,191,36,.45); } 50% { box-shadow: 0 0 0 6px rgba(251,191,36,0); } }
      `}</style>
    </div>
  );
}