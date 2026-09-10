"use client";

import { useState } from "react";
import type { CalendarEvent } from "@/types/calendar";
import { toJalali, fromJalali, jalaliMonthLength, JALALI_MONTH_NAMES, WEEKDAY_SHORT_FA, toIsoDate } from "@/lib/calendar/jalali";
import { expandEventsInRange } from "@/lib/calendar/recurrence";

export default function MonthView({
  currentDate, events, onDayClick, onEventClick, onEventMove,
}: {
  currentDate: Date;
  events: CalendarEvent[];
  onDayClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onEventMove: (event: CalendarEvent, newDate: Date) => void;
}) {
  const [dragOverIso, setDragOverIso] = useState<string | null>(null);
  const { jy, jm } = toJalali(currentDate);
  const daysInMonth = jalaliMonthLength(jy, jm);
  const firstOfMonth = fromJalali(jy, jm, 1);
  const leadingBlanks = firstOfMonth.getDay(); // یکشنبه=۰ مبنای هفته‌ی ایرانی

  const cells: (Date | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => fromJalali(jy, jm, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const rangeStart = cells.find(Boolean) as Date;
  const rangeEnd = [...cells].reverse().find(Boolean) as Date;
  const occurrences = expandEventsInRange(events, rangeStart, rangeEnd);

  const todayIso = toIsoDate(new Date());

  function eventsForDay(date: Date) {
    const iso = toIsoDate(date);
    return occurrences.filter((o) => toIsoDate(o.occurrenceStart) <= iso && toIsoDate(o.occurrenceEnd) >= iso).map((o) => o.event);
  }

  return (
    <div className="mv-wrap">
      <div className="mv-weekdays">
        {WEEKDAY_SHORT_FA.map((w) => (
          <div key={w} className="mv-weekday">{w}</div>
        ))}
      </div>
      <div className="mv-grid">
        {cells.map((date, i) => {
          if (!date) return <div key={`blank-${i}`} className="mv-cell mv-cell-blank" />;
          const iso = toIsoDate(date);
          const dayEvents = eventsForDay(date);
          const isToday = iso === todayIso;
          const { jd } = toJalali(date);
          const isDragOver = dragOverIso === iso;

          return (
            <div
              key={iso}
              className={`mv-cell ${isToday ? "today" : ""} ${isDragOver ? "drag-over" : ""}`}
              onClick={() => onDayClick(date)}
              onDragOver={(e) => { e.preventDefault(); setDragOverIso(iso); }}
              onDragLeave={() => setDragOverIso((v) => (v === iso ? null : v))}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverIso(null);
                const eventId = e.dataTransfer.getData("text/event-id");
                const dropped = events.find((ev) => ev.id === eventId);
                if (dropped && !dropped.isHoliday) onEventMove(dropped, date);
              }}
            >
              <span className="mv-daynum">{jd.toLocaleString("fa-IR")}</span>
              <div className="mv-events">
                {dayEvents.slice(0, 3).map((ev) => (
                  <div
                    key={ev.id}
                    className="mv-event-pill"
                    style={{ background: `${ev.color}26`, color: ev.color, borderColor: `${ev.color}55` }}
                    draggable={!ev.isHoliday}
                    onDragStart={(e) => e.dataTransfer.setData("text/event-id", ev.id)}
                    onClick={(e) => { e.stopPropagation(); onEventClick(ev); }}
                    title={ev.title}
                  >
                    {ev.title}
                  </div>
                ))}
                {dayEvents.length > 3 && <div className="mv-more">+{(dayEvents.length - 3).toLocaleString("fa-IR")} مورد دیگر</div>}
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .mv-wrap { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08); border-radius: 16px; overflow: hidden; }
        .mv-weekdays { display: grid; grid-template-columns: repeat(7, 1fr); background: rgba(255,255,255,.05); }
        .mv-weekday { text-align: center; padding: 8px 0; font-size: 12px; font-weight: 700; color: #9ca3af; }
        .mv-grid { display: grid; grid-template-columns: repeat(7, 1fr); }
        .mv-cell { min-height: 92px; border-top: 1px solid rgba(255,255,255,.06); border-inline-start: 1px solid rgba(255,255,255,.06); padding: 6px; cursor: pointer; transition: background .15s; }
        .mv-cell:hover { background: rgba(255,255,255,.04); }
        .mv-cell-blank { background: rgba(0,0,0,.12); cursor: default; }
        .mv-cell.today { background: rgba(251,191,36,.08); }
        .mv-cell.drag-over { background: rgba(34,197,94,.15); outline: 1px dashed #22c55e; }
        .mv-daynum { font-size: 12.5px; font-weight: 700; color: #e5e7eb; }
        .mv-cell.today .mv-daynum { color: #fbbf24; }
        .mv-events { margin-top: 4px; display: flex; flex-direction: column; gap: 3px; }
        .mv-event-pill { font-size: 10px; padding: 2px 6px; border-radius: 6px; border: 1px solid; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: grab; }
        .mv-more { font-size: 9.5px; color: #6b7280; }

        @media (max-width: 640px) {
          .mv-cell { min-height: 64px; }
          .mv-event-pill { font-size: 9px; }
        }
      `}</style>
    </div>
  );
}
