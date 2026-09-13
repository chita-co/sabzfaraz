"use client";

import type { CalendarEvent } from "@/types/calendar";
import { toJalali, fromJalali, jalaliMonthLength, JALALI_MONTH_NAMES, toIsoDate } from "@/lib/calendar/jalali";
import { expandEventsInRange } from "@/lib/calendar/recurrence";
import { MONTH_ACCENT_COLORS } from "@/lib/calendar/monthColors";

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
        const accent = MONTH_ACCENT_COLORS[mIndex];
        const daysInMonth = jalaliMonthLength(jy, jm);
        const firstOfMonth = fromJalali(jy, jm, 1);
        const leadingBlanks = (firstOfMonth.getDay() + 1) % 7;
        const cells: (Date | null)[] = [
          ...Array.from({ length: leadingBlanks }, () => null),
          ...Array.from({ length: daysInMonth }, (_, i) => fromJalali(jy, jm, i + 1)),
        ];

        return (
          <button key={jm} className="yv-month" style={{ ["--yv-accent" as string]: accent }} onClick={() => onMonthClick(firstOfMonth)}>
            <div className="yv-month-title"><span className="yv-month-dot" />{monthName}</div>
            <div className="yv-mini-grid">
              {cells.map((d, i) => {
                if (!d) return <span key={i} />;
                const iso = toIsoDate(d);
                const isToday = iso === todayIso;
                const isFriday = d.getDay() === 5;
                const hasHoliday = isoWithHoliday.has(iso);
                const hasEvent = isoWithEvents.has(iso);
                return (
                  <span key={iso} className={`yv-day ${isToday ? "today" : ""} ${hasHoliday ? "holiday" : hasEvent ? "has-event" : ""} ${isFriday ? "friday" : ""}`}>
                    {toJalali(d).jd.toLocaleString("fa-IR")}
                  </span>
                );
              })}
            </div>
          </button>
        );
      })}

      <style jsx>{`
        .yv-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
        @media (max-width: 900px) { .yv-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 480px) { .yv-grid { grid-template-columns: 1fr; } }
        .yv-month { background: rgba(255,255,255,.025); border: 1px solid rgba(255,255,255,.09); border-top: 2.5px solid var(--yv-accent); border-radius: 16px; padding: 12px; text-align: center; cursor: pointer; transition: border-color .15s, transform .15s, background .15s; }
        .yv-month:hover { background: rgba(255,255,255,.05); transform: translateY(-3px); box-shadow: 0 8px 20px -8px var(--yv-accent); }
        .yv-month-title { display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 13.5px; font-weight: 800; color: #fff; margin-bottom: 10px; }
        .yv-month-dot { width: 7px; height: 7px; border-radius: 999px; background: var(--yv-accent); box-shadow: 0 0 8px 1px var(--yv-accent); }
        .yv-mini-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
        .yv-day { font-size: 9px; color: #9ca3af; display: flex; align-items: center; justify-content: center; height: 17px; border-radius: 5px; }
        .yv-day.friday { color: #f87171; }
        .yv-day.today { background: var(--yv-accent); color: #0f2818; font-weight: 900; box-shadow: 0 0 10px -1px var(--yv-accent); }
        .yv-day.holiday { color: #f87171; font-weight: 700; }
        .yv-day.has-event { color: #4ade80; font-weight: 700; }
      `}</style>
    </div>
  );
}