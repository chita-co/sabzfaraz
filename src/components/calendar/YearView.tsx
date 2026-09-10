"use client";

import type { CalendarEvent } from "@/types/calendar";
import { toJalali, fromJalali, jalaliMonthLength, JALALI_MONTH_NAMES, toIsoDate } from "@/lib/calendar/jalali";
import { expandEventsInRange } from "@/lib/calendar/recurrence";

export default function YearView({
  currentDate, events, onMonthClick,
}: {
  currentDate: Date;
  events: CalendarEvent[];
  onMonthClick: (date: Date) => void;
}) {
  const { jy } = toJalali(currentDate);
  const todayIso = toIsoDate(new Date());

  const yearStart = fromJalali(jy, 1, 1);
  const yearEnd = fromJalali(jy, 12, jalaliMonthLength(jy, 12));
  const occurrences = expandEventsInRange(events, yearStart, yearEnd);
  const isoWithEvents = new Set(occurrences.map((o) => toIsoDate(o.occurrenceStart)));
  const isoWithHoliday = new Set(occurrences.filter((o) => o.event.isHoliday).map((o) => toIsoDate(o.occurrenceStart)));

  return (
    <div className="yv-grid">
      {JALALI_MONTH_NAMES.map((monthName, mIndex) => {
        const jm = mIndex + 1;
        const daysInMonth = jalaliMonthLength(jy, jm);
        const firstOfMonth = fromJalali(jy, jm, 1);
        const leadingBlanks = firstOfMonth.getDay();
        const cells: (Date | null)[] = [
          ...Array.from({ length: leadingBlanks }, () => null),
          ...Array.from({ length: daysInMonth }, (_, i) => fromJalali(jy, jm, i + 1)),
        ];

        return (
          <button key={jm} className="yv-month" onClick={() => onMonthClick(firstOfMonth)}>
            <div className="yv-month-title">{monthName}</div>
            <div className="yv-mini-grid">
              {cells.map((d, i) => {
                if (!d) return <span key={i} />;
                const iso = toIsoDate(d);
                const isToday = iso === todayIso;
                const hasHoliday = isoWithHoliday.has(iso);
                const hasEvent = isoWithEvents.has(iso);
                return (
                  <span key={iso} className={`yv-day ${isToday ? "today" : ""} ${hasHoliday ? "holiday" : hasEvent ? "has-event" : ""}`}>
                    {toJalali(d).jd.toLocaleString("fa-IR")}
                  </span>
                );
              })}
            </div>
          </button>
        );
      })}

      <style jsx>{`
        .yv-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        @media (max-width: 900px) { .yv-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 480px) { .yv-grid { grid-template-columns: 1fr; } }
        .yv-month { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08); border-radius: 14px; padding: 12px; text-align: center; cursor: pointer; transition: border-color .15s, transform .15s; }
        .yv-month:hover { border-color: rgba(251,191,36,.4); transform: translateY(-2px); }
        .yv-month-title { font-size: 13px; font-weight: 800; color: #fbbf24; margin-bottom: 8px; }
        .yv-mini-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
        .yv-day { font-size: 9px; color: #9ca3af; display: flex; align-items: center; justify-content: center; height: 16px; border-radius: 4px; }
        .yv-day.today { background: #fbbf24; color: #14532d; font-weight: 800; }
        .yv-day.holiday { color: #f87171; font-weight: 700; }
        .yv-day.has-event { color: #4ade80; font-weight: 700; }
      `}</style>
    </div>
  );
}
