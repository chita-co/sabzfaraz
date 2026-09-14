"use client";

import { useMemo } from "react";
import { Pencil, Trash2, ListChecks, Plus } from "lucide-react";
import type { CalendarEvent } from "@/types/calendar";
import { formatJalali } from "@/lib/calendar/jalali";

export default function MyEventsCard({
  events, onEventClick, onDeleteEvent, onAddEvent,
}: {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onDeleteEvent: (event: CalendarEvent) => void;
  onAddEvent: () => void;
}) {
  const myEvents = useMemo(
    () => [...events].filter((e) => !e.isHoliday).sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()),
    [events]
  );

  return (
    <div className="my-events-card-wrap">
      <div className="sb-card">
        <div className="sb-card-head-row">
          <div className="sb-card-head"><ListChecks size={14} /> رویدادهای من</div>
          <button className="sb-add-mini" onClick={onAddEvent}><Plus size={11} /> جدید</button>
        </div>
        {myEvents.length === 0 ? (
          <p className="sb-empty">در این بازه رویدادی ثبت نکرده‌اید.</p>
        ) : (
          <ul className="sb-event-list">
            {myEvents.map((e) => (
              <li key={e.id} style={{ borderInlineStartColor: e.color }}>
                <div className="sb-ev-info" onClick={() => onEventClick(e)}>
                  <span className="sb-ev-title">{e.title}</span>
                  <span className="sb-ev-date">{formatJalali(new Date(e.startAt), false)}</span>
                </div>
                <div className="sb-ev-actions">
                  <button onClick={() => onEventClick(e)} aria-label="ویرایش"><Pencil size={13} /></button>
                  <button onClick={() => onDeleteEvent(e)} aria-label="حذف" className="danger"><Trash2 size={13} /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

       <style jsx>{`
        .my-events-card-wrap { margin-top: 0; }
        .sb-card { background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08); border-radius: 12px; padding: 10px 12px; }
        .sb-card-head { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: #fbbf24; margin-bottom: 6px; }
        .sb-card-head-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0; }
        .sb-add-mini { display: flex; align-items: center; gap: 3px; background: rgba(251,191,36,.15); color: #fbbf24; border: none; border-radius: 999px; padding: 3px 9px; font-size: 10px; font-weight: 700; cursor: pointer; }
        .sb-empty { font-size: 11px; color: #6b7280; margin: 6px 0 0; }
        .sb-event-list { list-style: none; margin: 8px 0 0; padding: 0; display: flex; flex-direction: column; gap: 4px; max-height: 140px; overflow-y: auto; }
        .sb-event-list li { display: flex; align-items: center; justify-content: space-between; gap: 6px; background: rgba(255,255,255,.03); border-inline-start: 3px solid; border-radius: 7px; padding: 5px 9px; font-size: 11.5px; }
        .sb-event-list li:hover { background: rgba(255,255,255,.07); }
        .sb-ev-info { display: flex; flex-direction: column; cursor: pointer; overflow: hidden; flex: 1; gap: 1px; }
        .sb-ev-title { color: #e5e7eb; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11.5px; }
        .sb-ev-date { color: #6b7280; font-size: 10px; white-space: nowrap; }
        .sb-ev-actions { display: flex; gap: 3px; flex-shrink: 0; }
        .sb-ev-actions button { background: rgba(255,255,255,.06); border: none; color: #d1d5db; width: 22px; height: 22px; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .sb-ev-actions button:hover { background: rgba(255,255,255,.15); }
        .sb-ev-actions button.danger:hover { background: rgba(239,68,68,.25); color: #f87171; }
      `}</style>
    </div>
  );
}