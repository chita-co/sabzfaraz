"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock, CalendarPlus } from "lucide-react";
import type { CalendarEvent } from "@/types/calendar";
import { formatJalali } from "@/lib/calendar/jalali";

function useCountdown(target: Date | null) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!target || now === null) return null;
  const diff = Math.max(0, target.getTime() - now);
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

export default function UpcomingEventsPanel({
  events, onEventClick, onAddEvent,
}: {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onAddEvent: () => void;
}) {
  const upcoming = useMemo(() => {
    const now = Date.now();
    return [...events]
      .filter((e) => new Date(e.startAt).getTime() >= now - 3600000)
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
      .slice(0, 10);
  }, [events]);

  const nextEvent = upcoming[0];
  const countdown = useCountdown(nextEvent ? new Date(nextEvent.startAt) : null);

  return (
    <section className="uep-wrap">
      <div className="uep-head">
        <h2><CalendarPlus size={16} /> رویدادهای پیش‌رو</h2>
        <button onClick={onAddEvent}>+ رویداد جدید</button>
      </div>

      <div className="uep-body">
        {nextEvent && countdown && (
          <div className="uep-countdown">
            <div className="uep-countdown-head"><Clock size={13} /> شمارش معکوس تا «{nextEvent.title}»</div>
            <div className="uep-countdown-nums">
              <span>{countdown.days.toLocaleString("fa-IR")}<b>روز</b></span>
              <span>{countdown.hours.toLocaleString("fa-IR")}<b>ساعت</b></span>
              <span>{countdown.minutes.toLocaleString("fa-IR")}<b>دقیقه</b></span>
              <span>{countdown.seconds.toLocaleString("fa-IR")}<b>ثانیه</b></span>
            </div>
          </div>
        )}

        {upcoming.length === 0 ? (
          <p className="uep-empty">رویداد پیش‌رویی ثبت نشده.</p>
        ) : (
          <ul className="uep-list">
            {upcoming.map((e) => (
              <li key={e.id} onClick={() => onEventClick(e)} style={{ borderInlineStartColor: e.color }}>
                <span className="uep-title">{e.title}</span>
                <span className="uep-date">{formatJalali(new Date(e.startAt), false)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <style jsx>{`
        .uep-wrap { max-width: 1300px; margin: 18px auto 0; padding: 0 16px; }
        .uep-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .uep-head h2 { display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 800; color: #fbbf24; margin: 0; }
        .uep-head button { background: rgba(251,191,36,.15); color: #fbbf24; border: none; border-radius: 999px; padding: 6px 14px; font-size: 11.5px; font-weight: 700; cursor: pointer; }
        .uep-body { background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08); border-radius: 16px; padding: 16px; }
        .uep-empty { font-size: 12px; color: #6b7280; margin: 0; }

        .uep-countdown { margin-bottom: 14px; }
        .uep-countdown-head { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #d1d5db; margin-bottom: 8px; }
        .uep-countdown-nums { display: flex; gap: 8px; max-width: 420px; }
        .uep-countdown-nums span { flex: 1; background: rgba(255,255,255,.06); border-radius: 10px; padding: 8px 4px; text-align: center; font-size: 17px; font-weight: 900; color: #fff; font-variant-numeric: tabular-nums; display: flex; flex-direction: column; gap: 2px; }
        .uep-countdown-nums b { font-size: 9px; font-weight: 400; color: #9ca3af; }

        .uep-list { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 8px; }
        .uep-list li { display: flex; align-items: center; justify-content: space-between; gap: 8px; background: rgba(255,255,255,.03); border-inline-start: 3px solid; border-radius: 8px; padding: 8px 10px; cursor: pointer; font-size: 12px; }
        .uep-list li:hover { background: rgba(255,255,255,.08); }
        .uep-title { color: #e5e7eb; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .uep-date { color: #6b7280; font-size: 10.5px; white-space: nowrap; }
      `}</style>
    </section>
  );
}
