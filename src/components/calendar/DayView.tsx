"use client";

import type { CalendarEvent } from "@/types/calendar";
import { toJalali, toApproximateHijri, JALALI_MONTH_NAMES, HIJRI_MONTH_NAMES, WEEKDAY_NAMES_FA, toIsoDate } from "@/lib/calendar/jalali";
import { getHolidaysInRange } from "@/lib/calendar/holidays";
import { expandEventsInRange } from "@/lib/calendar/recurrence";
import { MONTH_ACCENT_COLORS } from "@/lib/calendar/monthColors";
import { Plus } from "lucide-react";

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
  const todayIso = toIsoDate(new Date());
  const dayIso = toIsoDate(currentDate);
  const isToday = dayIso === todayIso;

  const dayStart = new Date(currentDate); dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(currentDate); dayEnd.setHours(23, 59, 59, 999);
  const occurrences = expandEventsInRange(events, dayStart, dayEnd);
  const personalEvents = occurrences
    .filter((o) => !o.event.isHoliday && toIsoDate(o.occurrenceStart) <= dayIso && toIsoDate(o.occurrenceEnd) >= dayIso)
    .map((o) => o.event)
    .sort((a, b) => (a.allDay === b.allDay ? new Date(a.startAt).getTime() - new Date(b.startAt).getTime() : a.allDay ? -1 : 1));

  const occasions = getHolidaysInRange(currentDate, currentDate);

  return (
    <div className="dv-stage">
      <div className="dv-card" style={{ ["--dv-accent" as string]: accent }}>
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
            <div className="dv-occasions-list">
              {Array.from(new Map(occasions.map((o) => [o.title, o])).values()).map((o, i) => (
              <span key={i} className={`dv-occasion-chip ${o.isHoliday ? "holiday" : ""}`}>{o.title}</span>
            ))}
            </div>
          </div>
        )}

        <div className="dv-events-section">
          <div className="dv-section-head">
            <span className="dv-section-title">رویدادهای {isToday ? "امروز" : "این روز"}</span>
            <button type="button" className="dv-add-btn" onClick={() => onSlotClick(currentDate)}><Plus size={12} /> افزودن</button>
          </div>
          {personalEvents.length === 0 ? (
            <p className="dv-empty">رویدادی برای این روز ثبت نشده.</p>
          ) : (
            <div className="dv-events-list">
              {personalEvents.map((ev) => (
                <div key={ev.id} className="dv-event-row" style={{ borderInlineStartColor: ev.color }} onClick={() => onEventClick(ev)}>
                  <span className="dv-event-time">{ev.allDay ? "تمام روز" : new Date(ev.startAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}</span>
                  <span className="dv-event-title" style={{ color: ev.color }}>{ev.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .dv-stage { min-height: 520px; display: flex; align-items: center; justify-content: center; padding: 28px 16px; }
        .dv-card { width: 100%; max-width: 420px; background: rgba(255,255,255,.3); backdrop-filter: blur(18px) saturate(160%); -webkit-backdrop-filter: blur(18px) saturate(160%); border: 1px solid rgba(255,255,255,.35); border-radius: 22px; box-shadow: 0 20px 45px -16px rgba(0,0,0,.55); padding: 22px; display: flex; flex-direction: column; gap: 18px; color: #2c1f0d; }
        .dv-hero { text-align: center; padding-bottom: 16px; border-bottom: 1px dashed rgba(0,0,0,.1); }
        .dv-hero-weekday { font-size: 12.5px; color: var(--dv-accent); font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .dv-friday-tag { background: rgba(194,59,59,.12); color: #c23b3b; font-size: 10px; padding: 1px 8px; border-radius: 999px; }
        .dv-hero-main { margin-top: 8px; display: flex; align-items: baseline; justify-content: center; gap: 8px; flex-wrap: wrap; }
        .dv-hero-num { font-size: 44px; font-weight: 900; color: #3f2d12; line-height: 1; }
        .dv-hero-month { font-size: 15px; font-weight: 700; color: var(--dv-accent); }
        .dv-hero-sub { margin-top: 8px; font-size: 11px; color: #92714a; display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap; direction: ltr; }
        .dv-dot { opacity: .5; }
        .dv-occasions-list { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; }
        .dv-occasion-chip { font-size: 10.5px; padding: 5px 12px; border-radius: 999px; background: rgba(0,0,0,.04); border: 1px solid rgba(0,0,0,.08); color: #6b563a; }
        .dv-occasion-chip.holiday { background: rgba(194,59,59,.1); border-color: rgba(194,59,59,.3); color: #c23b3b; }
        .dv-section-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .dv-section-title { font-size: 12px; font-weight: 800; color: #4a3418; }
        .dv-add-btn { display: flex; align-items: center; gap: 4px; font-size: 10.5px; font-weight: 700; color: #fff; background: var(--dv-accent); border: none; border-radius: 8px; padding: 5px 10px; cursor: pointer; }
        .dv-empty { font-size: 11.5px; color: #a08658; text-align: center; margin: 0; padding: 10px 0; }
        .dv-events-list { display: flex; flex-direction: column; gap: 7px; }
        .dv-event-row { display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,.5); border: 1px solid rgba(255,255,255,.4); border-inline-start: 3px solid; border-radius: 10px; padding: 9px 12px; cursor: pointer; }
        .dv-event-time { font-size: 10.5px; color: #92714a; min-width: 46px; }
        .dv-event-title { font-size: 12px; font-weight: 700; }
      `}</style>
    </div>
  );
}