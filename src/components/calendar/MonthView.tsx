"use client";

import { useState } from "react";
import type { CalendarEvent } from "@/types/calendar";
import { toJalali, fromJalali, jalaliMonthLength, JALALI_MONTH_NAMES, GREGORIAN_MONTH_NAMES_FA, HIJRI_MONTH_NAMES, toApproximateHijri, toIsoDate } from "@/lib/calendar/jalali";
import { expandEventsInRange } from "@/lib/calendar/recurrence";
import { MONTH_ACCENT_COLORS } from "@/lib/calendar/monthColors";
import { Plus } from "lucide-react";

const WEEKDAY_SAT_FIRST_FULL = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];

export default function MonthView({
  currentDate, events, onDayClick, onEventClick,
}: {
  currentDate: Date;
  events: CalendarEvent[];
  onDayClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}) {
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

  const [selectedIso, setSelectedIso] = useState<string>(todayIso);
  const [prevMonthKey, setPrevMonthKey] = useState(`${jy}-${jm}`);
  const currentMonthKey = `${jy}-${jm}`;
  if (currentMonthKey !== prevMonthKey) {
    setPrevMonthKey(currentMonthKey);
    const hasToday = cells.some((d) => d && toIsoDate(d) === todayIso);
    setSelectedIso(hasToday ? todayIso : toIsoDate(fromJalali(jy, jm, 1)));
  }

  function eventsForDay(date: Date) {
    const iso = toIsoDate(date);
    return occurrences.filter((o) => toIsoDate(o.occurrenceStart) <= iso && toIsoDate(o.occurrenceEnd) >= iso).map((o) => o.event);
  }

  const selectedDate = cells.find((d) => d && toIsoDate(d) === selectedIso) ?? firstOfMonth;
  const selectedEvents = eventsForDay(selectedDate);
  const { jd: selectedJd } = toJalali(selectedDate);

  const gregRangeLabel =
    firstOfMonth.getMonth() === lastOfMonth.getMonth()
      ? GREGORIAN_MONTH_NAMES_FA[firstOfMonth.getMonth()]
      : `${GREGORIAN_MONTH_NAMES_FA[firstOfMonth.getMonth()]} / ${GREGORIAN_MONTH_NAMES_FA[lastOfMonth.getMonth()]}`;
  const hFirst = toApproximateHijri(firstOfMonth);
  const hLast = toApproximateHijri(lastOfMonth);
  const hijriLabel = hFirst.hm === hLast.hm ? HIJRI_MONTH_NAMES[hFirst.hm - 1] : `${HIJRI_MONTH_NAMES[hFirst.hm - 1]} / ${HIJRI_MONTH_NAMES[hLast.hm - 1]}`;

  return (
    <div className="mv-stage">
      <div className="mv-card" style={{ ["--mv-accent" as string]: accent }}>
        <div className="mv-head">
          <div className="mv-head-info">
            <span className="mv-head-greg">{gregRangeLabel}</span>
            <span className="mv-head-hijri">{hijriLabel}</span>
          </div>
          <div className="mv-badge">
            <span className="mv-badge-name">{JALALI_MONTH_NAMES[jm - 1]}</span>
            <span className="mv-badge-year">{jy.toLocaleString("fa-IR")}</span>
          </div>
        </div>

        <div className="mv-weekdays">
          {WEEKDAY_SAT_FIRST_FULL.map((w, i) => (
          <div key={w} className={`mv-weekday ${i === 6 ? "friday" : ""}`}><span>{w}</span></div>
        ))}
        </div>

        <div className="mv-grid">
          {cells.map((date, i) => {
            if (!date) return <div key={`blank-${i}`} className="mv-cell mv-cell-blank" />;
            const iso = toIsoDate(date);
            const dayEvents = eventsForDay(date);
            const isToday = iso === todayIso;
            const isFriday = date.getDay() === 5;
            const isSelected = iso === selectedIso;
            const { jd } = toJalali(date);
            const hasHoliday = dayEvents.some((e) => e.isHoliday);

            return (
              <button
                key={iso}
                type="button"
                className={`mv-cell ${isToday ? "today" : ""} ${isFriday ? "friday" : ""} ${isSelected ? "selected" : ""}`}
                onClick={() => setSelectedIso(iso)}
              >
                <span className="mv-daynum-wrap"><span className="mv-daynum">{jd.toLocaleString("fa-IR")}</span></span>
                <span className="mv-daynum-greg">{date.getDate()}</span>
                {dayEvents.length > 0 && <span className={`mv-cell-dot ${hasHoliday ? "holiday" : ""}`} />}
              </button>
            );
          })}
        </div>

        <div className="mv-panel">
          <div className="mv-panel-head">
            <span className="mv-panel-date">رویدادهای {selectedJd.toLocaleString("fa-IR")} {JALALI_MONTH_NAMES[jm - 1]}</span>
            <button type="button" className="mv-panel-add" onClick={() => onDayClick(selectedDate)}><Plus size={12} /> افزودن</button>
          </div>
          <div className="mv-panel-list">
            {selectedEvents.length === 0 && <p className="mv-panel-empty">رویدادی برای این روز ثبت نشده.</p>}
            {selectedEvents.map((ev) => (
              <div key={ev.id} className="mv-panel-event" style={{ borderInlineStartColor: ev.color }} onClick={() => onEventClick(ev)}>
                {ev.title}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .mv-stage { min-height: 460px; display: flex; align-items: center; justify-content: center; padding: 20px 16px; }
        .mv-card { width: 100%; max-width: 400px; background: rgba(255,255,255,.3); backdrop-filter: blur(18px) saturate(160%); -webkit-backdrop-filter: blur(18px) saturate(160%); border: 1px solid rgba(255,255,255,.35); border-radius: 20px; box-shadow: 0 20px 45px -16px rgba(0,0,0,.55); overflow: hidden; color: #2c1f0d; }
        .mv-head { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px 6px; }
        .mv-head-info { display: flex; flex-direction: column; gap: 2px; }
        .mv-head-greg { font-size: 10px; color: #5a4322; font-weight: 700; direction: ltr; }
        .mv-head-hijri { font-size: 9px; color: #6b5330; }
        .mv-badge { width: 48px; height: 48px; border-radius: 999px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #fff; background: var(--mv-accent); box-shadow: 0 6px 14px -4px var(--mv-accent); }
        .mv-badge-name { font-size: 10px; font-weight: 900; }
        .mv-badge-year { font-size: 7.5px; opacity: .9; }
        .mv-weekdays { display: grid; grid-template-columns: repeat(7, 1fr); padding: 4px 10px 2px; }
        .mv-weekday { text-align: center; font-size: 6.6px; font-weight: 800; color: #5a4322; padding-bottom: 4px; white-space: nowrap; }
        .mv-weekday span { display: inline-block; transform: rotate(-18deg); }
        .mv-weekday.friday { color: #c23b3b; }
        .mv-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; padding: 0 10px 10px; }
        .mv-cell { aspect-ratio: 1; border: none; border-radius: 7px; background: rgba(255,255,255,.18); display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; transition: background .15s; }
        .mv-cell:hover { background: rgba(255,255,255,.35); }
        .mv-cell-blank { visibility: hidden; }
        .mv-daynum-wrap { display: flex; align-items: center; justify-content: center; }
        .mv-daynum { font-size: 11px; font-weight: 800; color: #2c1f0d; text-shadow: 0 1px 2px rgba(255,255,255,.5); }
        .mv-daynum-greg { font-size: 6.5px; color: #6b5330; margin-top: 1px; }
        .mv-cell.friday .mv-daynum { color: #c23b3b; }
        .mv-cell.today .mv-daynum-wrap { width: 20px; height: 20px; border-radius: 999px; background: var(--mv-accent); }
        .mv-cell.today .mv-daynum { color: #fff; text-shadow: none; }
        .mv-cell.selected { box-shadow: inset 0 0 0 2px var(--mv-accent); }
        .mv-cell-dot { width: 6px; height: 6px; border-radius: 999px; background: var(--mv-accent); margin-top: 3px; box-shadow: 0 0 4px 0 var(--mv-accent); }
        .mv-cell-dot.holiday { background: #c23b3b; box-shadow: 0 0 5px 0 #c23b3b; }
        .mv-panel { border-top: 1px solid rgba(255,255,255,.3); background: rgba(255,255,255,.14); padding: 10px 14px 12px; }
        .mv-panel-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; gap: 8px; }
        .mv-panel-date { font-size: 10px; font-weight: 800; color: #2c1f0d; text-shadow: 0 1px 2px rgba(255,255,255,.5); }
        .mv-panel-add { display: flex; align-items: center; gap: 4px; font-size: 9.5px; font-weight: 700; color: #fff; background: var(--mv-accent); border: none; border-radius: 7px; padding: 4px 9px; cursor: pointer; white-space: nowrap; }
        .mv-panel-list { display: flex; flex-direction: column; gap: 4px; max-height: 100px; overflow-y: auto; }
        .mv-panel-empty { font-size: 10px; color: #6b5330; text-align: center; padding: 5px 0; margin: 0; }
        .mv-panel-event { background: rgba(255,255,255,.55); border: 1px solid rgba(255,255,255,.4); border-inline-start: 3px solid; border-radius: 7px; padding: 5px 9px; font-size: 10.5px; font-weight: 700; color: #2c1f0d; cursor: pointer; }

        @media (max-width: 480px) {
          .mv-card { max-width: 100%; }
        }
      `}</style>
    </div>
  );
}