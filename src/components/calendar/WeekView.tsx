"use client";

import type { CalendarEvent } from "@/types/calendar";
import { toJalali, toIsoDate, JALALI_MONTH_NAMES } from "@/lib/calendar/jalali";
import { expandEventsInRange } from "@/lib/calendar/recurrence";
import { MONTH_ACCENT_COLORS } from "@/lib/calendar/monthColors";
import { getHolidaysInRange } from "@/lib/calendar/holidays";

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

  const rangeLabel = `${toJalali(days[0]).jd.toLocaleString("fa-IR")} تا ${toJalali(days[6]).jd.toLocaleString("fa-IR")} ${JALALI_MONTH_NAMES[toJalali(days[6]).jm - 1]}`;

  return (
    <div className="wv-stage">
      <div className="wv-card">
        <div className="wv-head">{rangeLabel}</div>
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
                <span className="wv-weekday">{WEEKDAY_NAMES_SAT_FIRST[i]}</span>
                <span className="wv-daynum">{jd.toLocaleString("fa-IR")}</span>
                <span className="wv-month-tag">{JALALI_MONTH_NAMES[jm - 1]}</span>
                {Array.from(new Map(getHolidaysInRange(d, d).map((o) => [o.title, o])).values()).map((o, oi) => (
                  <span key={oi} className={`wv-occasion ${o.isHoliday ? "holiday" : ""}`}>{o.title}</span>
                ))}
                <div className="wv-events">
                  {dayEvents.map((ev) => (
                    <div key={ev.id} className="wv-event" style={{ background: `${ev.color}22`, color: ev.color, border: `1px solid ${ev.color}55` }} onClick={(e) => { e.stopPropagation(); onEventClick(ev); }} title={ev.title}>
                      {ev.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .wv-stage { min-height: 520px; display: flex; align-items: center; justify-content: center; padding: 28px 16px; }
        .wv-card { width: 100%; max-width: 820px; background: rgba(255,255,255,.3); backdrop-filter: blur(18px) saturate(160%); -webkit-backdrop-filter: blur(18px) saturate(160%); border: 1px solid rgba(255,255,255,.35); border-radius: 22px; box-shadow: 0 20px 45px -16px rgba(0,0,0,.55); padding: 18px; color: #2c1f0d; }
        .wv-head { text-align: center; font-size: 12.5px; font-weight: 800; color: #7a5a2e; margin-bottom: 14px; }
        .wv-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
        @media (max-width: 720px) { .wv-grid { grid-template-columns: repeat(4, 1fr); } }
        @media (max-width: 420px) { .wv-grid { grid-template-columns: repeat(2, 1fr); } }
        .wv-day { background: rgba(255,255,255,.2); border-radius: 12px; border-top: 3px solid var(--wv-accent); padding: 8px 5px 10px; text-align: center; cursor: pointer; display: flex; flex-direction: column; align-items: center; min-height: 195px; transition: background .15s; }
        .wv-day:hover { background: rgba(255,255,255,.35); }
        .wv-day.friday { border-top-color: #c23b3b; }
        .wv-day.today { background: var(--wv-accent); }
        .wv-day.today .wv-weekday, .wv-day.today .wv-daynum, .wv-day.today .wv-month-tag { color: #fff; }
        .wv-day.today .wv-occasion { background: rgba(255,255,255,.25); color: #fff; }
        .wv-weekday { font-size: 9.5px; color: #7a5a2e; font-weight: 700; }
        .wv-daynum { font-size: 17px; font-weight: 900; color: #3f2d12; margin: 3px 0; }
        .wv-month-tag { font-size: 8px; color: var(--wv-accent); font-weight: 700; margin-bottom: 4px; }
        .wv-occasion { font-size: 9.5px; font-weight: 700; color: #2c1f0d; background: rgba(255,255,255,.78); border-radius: 6px; padding: 3px 6px; margin-bottom: 4px; line-height: 1.4; display: block; }
        .wv-occasion.holiday { color: #fff; background: #c23b3b; font-weight: 800; }
        .wv-events { display: flex; flex-direction: column; gap: 3px; width: 100%; max-height: 100px; overflow-y: auto; }
        .wv-event { font-size: 8.5px; padding: 3px 4px; border-radius: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer; }
      `}</style>
    </div>
  );
}