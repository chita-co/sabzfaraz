"use client";

import { useState } from "react";
import type { CalendarEvent } from "@/types/calendar";
import { toJalali, fromJalali, jalaliMonthLength, JALALI_MONTH_NAMES, GREGORIAN_MONTH_NAMES_FA, toIsoDate } from "@/lib/calendar/jalali";
import { expandEventsInRange } from "@/lib/calendar/recurrence";
import { MONTH_ACCENT_COLORS } from "@/lib/calendar/monthColors";

const WEEKDAY_SAT_FIRST_SHORT = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

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
  const accent = MONTH_ACCENT_COLORS[jm - 1];
  const daysInMonth = jalaliMonthLength(jy, jm);
  const firstOfMonth = fromJalali(jy, jm, 1);
  const lastOfMonth = fromJalali(jy, jm, daysInMonth);
  const leadingBlanks = (firstOfMonth.getDay() + 1) % 7; // شنبه = ۰

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

  const gregRangeLabel =
    firstOfMonth.getMonth() === lastOfMonth.getMonth()
      ? GREGORIAN_MONTH_NAMES_FA[firstOfMonth.getMonth()]
      : `${GREGORIAN_MONTH_NAMES_FA[firstOfMonth.getMonth()]} - ${GREGORIAN_MONTH_NAMES_FA[lastOfMonth.getMonth()]}`;

  return (
    <div className="mv-wrap" style={{ ["--mv-accent" as string]: accent }}>
      <div className="mv-title-bar">
        <div className="mv-title-badge">
          <span className="mv-title-name">{JALALI_MONTH_NAMES[jm - 1]}</span>
          <span className="mv-title-year">{jy.toLocaleString("fa-IR")}</span>
        </div>
        <span className="mv-title-greg">{gregRangeLabel} {firstOfMonth.getFullYear()}</span>
      </div>

      <div className="mv-weekdays">
        {WEEKDAY_SAT_FIRST_SHORT.map((w, i) => (
          <div key={w} className={`mv-weekday ${i === 6 ? "friday" : ""}`}>{w}</div>
        ))}
      </div>
      <div className="mv-grid">
        {cells.map((date, i) => {
          if (!date) return <div key={`blank-${i}`} className="mv-cell mv-cell-blank" />;
          const iso = toIsoDate(date);
          const dayEvents = eventsForDay(date);
          const isToday = iso === todayIso;
          const isFriday = date.getDay() === 5;
          const { jd } = toJalali(date);
          const isDragOver = dragOverIso === iso;

          return (
            <div
              key={iso}
              className={`mv-cell ${isToday ? "today" : ""} ${isDragOver ? "drag-over" : ""} ${isFriday ? "friday" : ""}`}
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
              <div className="mv-cell-head">
                <span className="mv-daynum">
                  {isToday ? <span className="mv-today-badge">{jd.toLocaleString("fa-IR")}</span> : jd.toLocaleString("fa-IR")}
                </span>
                <span className="mv-daynum-greg">{date.getDate()}</span>
              </div>
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
        .mv-wrap { background: rgba(255,255,255,.045); border: 1px solid rgba(255,255,255,.1); border-radius: 20px; overflow: hidden; }
        .mv-title-bar { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,.08); flex-wrap: wrap; gap: 8px; }
        .mv-title-badge { display: flex; align-items: baseline; gap: 8px; background: linear-gradient(135deg, var(--mv-accent), transparent 160%); padding: 6px 18px; border-radius: 999px; border: 1px solid var(--mv-accent); box-shadow: 0 0 18px -4px var(--mv-accent); }
        .mv-title-name { font-size: 18px; font-weight: 900; color: #fff; }
        .mv-title-year { font-size: 12px; color: rgba(255,255,255,.75); }
        .mv-title-greg { font-size: 11.5px; color: #9ca3af; direction: ltr; }
        .mv-weekdays { display: grid; grid-template-columns: repeat(7, 1fr); background: rgba(255,255,255,.05); }
        .mv-weekday { text-align: center; padding: 9px 0; font-size: 12px; font-weight: 700; color: #9ca3af; }
        .mv-weekday.friday { color: #f87171; }
        .mv-grid { display: grid; grid-template-columns: repeat(7, 1fr); }
        .mv-cell { min-height: 96px; border-top: 1px solid rgba(255,255,255,.06); border-inline-start: 1px solid rgba(255,255,255,.06); padding: 8px; cursor: pointer; transition: background .15s; }
        .mv-cell:hover { background: rgba(255,255,255,.05); }
        .mv-cell-blank { background: rgba(0,0,0,.14); cursor: default; }
        .mv-cell.friday:not(.mv-cell-blank) { background: rgba(248,113,113,.045); }
        .mv-cell.today { background: linear-gradient(160deg, var(--mv-accent) -60%, rgba(255,255,255,.06) 40%); box-shadow: inset 0 0 0 1.5px var(--mv-accent); }
        .mv-cell.drag-over { background: rgba(34,197,94,.15); outline: 1px dashed #22c55e; }
        .mv-cell-head { display: flex; align-items: center; justify-content: space-between; }
        .mv-daynum { font-size: 13px; font-weight: 800; color: #e5e7eb; }
        .mv-today-badge { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 999px; background: var(--mv-accent); color: #0f2818; font-weight: 900; animation: cal-pulse 2.4s ease-in-out infinite; }
        .mv-daynum-greg { font-size: 9.5px; color: #6b7280; direction: ltr; }
        .mv-cell.friday .mv-daynum { color: #f87171; }
        .mv-events { margin-top: 6px; display: flex; flex-direction: column; gap: 3px; }
        .mv-event-pill { font-size: 10px; padding: 2px 6px; border-radius: 6px; border: 1px solid; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: grab; }
        .mv-more { font-size: 9.5px; color: #6b7280; }
        @keyframes cal-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(251,191,36,.45); } 50% { box-shadow: 0 0 0 6px rgba(251,191,36,0); } }

        @media (max-width: 640px) {
          .mv-cell { min-height: 68px; padding: 5px; }
          .mv-event-pill { font-size: 9px; }
        }
      `}</style>
    </div>
  );
}