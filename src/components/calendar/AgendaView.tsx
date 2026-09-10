"use client";

import type { CalendarEvent, CalendarViewMode } from "@/types/calendar";
import { WEEKDAY_NAMES_FA, toJalali, toIsoDate } from "@/lib/calendar/jalali";
import { expandEventsInRange } from "@/lib/calendar/recurrence";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function getWeekDays(date: Date): Date[] {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export default function AgendaView({
  currentDate, viewMode, events, onSlotClick, onEventClick,
}: {
  currentDate: Date;
  viewMode: CalendarViewMode;
  events: CalendarEvent[];
  onSlotClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}) {
  const days = viewMode === "day" ? [currentDate] : getWeekDays(currentDate);
  const rangeStart = new Date(days[0]); rangeStart.setHours(0, 0, 0, 0);
  const rangeEnd = new Date(days[days.length - 1]); rangeEnd.setHours(23, 59, 59, 999);
  const occurrences = expandEventsInRange(events, rangeStart, rangeEnd);
  const todayIso = toIsoDate(new Date());

  function eventsForDayHour(day: Date, hour: number) {
    const dayIso = toIsoDate(day);
    return occurrences.filter((o) => {
      if (toIsoDate(o.occurrenceStart) !== dayIso && !o.event.allDay) return false;
      if (o.event.allDay) return toIsoDate(o.occurrenceStart) === dayIso && hour === 0;
      return o.occurrenceStart.getHours() === hour;
    });
  }

  return (
    <div className="av-wrap">
      <div className="av-header" style={{ gridTemplateColumns: `56px repeat(${days.length}, 1fr)` }}>
        <div />
        {days.map((d) => {
          const iso = toIsoDate(d);
          const { jd } = toJalali(d);
          return (
            <div key={iso} className={`av-day-head ${iso === todayIso ? "today" : ""}`}>
              <span className="av-weekday">{WEEKDAY_NAMES_FA[d.getDay()]}</span>
              <span className="av-daynum">{jd.toLocaleString("fa-IR")}</span>
            </div>
          );
        })}
      </div>

      <div className="av-body">
        {HOURS.map((hour) => (
          <div key={hour} className="av-row" style={{ gridTemplateColumns: `56px repeat(${days.length}, 1fr)` }}>
            <div className="av-hour">{String(hour).padStart(2, "0")}:۰۰</div>
            {days.map((d) => {
              const iso = toIsoDate(d);
              const slotEvents = eventsForDayHour(d, hour);
              return (
                <div
                  key={iso}
                  className="av-slot"
                  onClick={() => {
                    const dt = new Date(d);
                    dt.setHours(hour, 0, 0, 0);
                    onSlotClick(dt);
                  }}
                >
                  {slotEvents.map((o) => (
                    <div
                      key={o.event.id + hour}
                      className="av-event"
                      style={{ background: `${o.event.color}26`, color: o.event.color, borderColor: `${o.event.color}55` }}
                      onClick={(e) => { e.stopPropagation(); onEventClick(o.event); }}
                    >
                      {o.event.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <style jsx>{`
        .av-wrap { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08); border-radius: 16px; overflow: hidden; }
        .av-header { display: grid; border-bottom: 1px solid rgba(255,255,255,.08); }
        .av-day-head { text-align: center; padding: 10px 4px; }
        .av-day-head.today { background: rgba(251,191,36,.1); }
        .av-weekday { display: block; font-size: 11px; color: #9ca3af; }
        .av-daynum { display: block; font-size: 15px; font-weight: 800; color: #fff; }
        .av-body { max-height: 560px; overflow-y: auto; }
        .av-row { display: grid; border-top: 1px solid rgba(255,255,255,.05); min-height: 46px; }
        .av-hour { font-size: 10px; color: #6b7280; padding: 4px 6px; text-align: center; }
        .av-slot { border-inline-start: 1px solid rgba(255,255,255,.05); padding: 3px; cursor: pointer; display: flex; flex-direction: column; gap: 2px; }
        .av-slot:hover { background: rgba(255,255,255,.03); }
        .av-event { font-size: 10.5px; padding: 2px 6px; border-radius: 6px; border: 1px solid; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      `}</style>
    </div>
  );
}
