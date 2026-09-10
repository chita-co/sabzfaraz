"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Pencil, Trash2, NotebookPen, BarChart3, ListChecks, Plus } from "lucide-react";
import type { CalendarEvent } from "@/types/calendar";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/types/calendar";
import { formatJalali, toIsoDate } from "@/lib/calendar/jalali";
import { getGuestNotes, saveGuestNote, deleteGuestNote } from "@/lib/calendar/storage";

interface NoteItem { date: string; content: string }

export default function Sidebar({
  events, currentDate, onEventClick, onDeleteEvent, onAddEvent, isLoggedIn,
}: {
  events: CalendarEvent[];
  currentDate: Date;
  onEventClick: (event: CalendarEvent) => void;
  onDeleteEvent: (event: CalendarEvent) => void;
  onAddEvent: () => void;
  isLoggedIn: boolean;
}) {
  // ---------------- رویدادهای من ----------------
  const myEvents = useMemo(
    () => [...events].filter((e) => !e.isHoliday).sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()),
    [events]
  );

  // ---------------- یادداشت‌های من ----------------
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [activeDate, setActiveDate] = useState(toIsoDate(currentDate));
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const loadNotes = useMemo(
    () => async () => {
      if (isLoggedIn) {
        try {
          const res = await fetch("/api/calendar/notes");
          const data = await res.json();
          setNotes((data.notes ?? []).map((n: { date: string; content: string }) => ({ date: n.date, content: n.content })));
        } catch {
          setNotes([]);
        }
      } else {
        const guest = getGuestNotes();
        setNotes(Object.values(guest).map((n) => ({ date: n.date, content: n.content })));
      }
    },
    [isLoggedIn]
  );

  useEffect(() => {
    const timer = setTimeout(() => loadNotes(), 0);
    return () => clearTimeout(timer);
  }, [loadNotes]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveDate(toIsoDate(currentDate));
      const found = notes.find((n) => n.date === toIsoDate(currentDate));
      setNoteText(found?.content ?? "");
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate]);

  function openNoteForEdit(n: NoteItem) {
    setActiveDate(n.date);
    setNoteText(n.content);
  }

  async function saveNote() {
    if (!noteText.trim()) return;
    setSavingNote(true);
    try {
      if (isLoggedIn) {
        await fetch("/api/calendar/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: activeDate, content: noteText }),
        });
      } else {
        saveGuestNote(activeDate, noteText);
      }
      toast.success("یادداشت ذخیره شد.");
      loadNotes();
    } catch {
      toast.error("ذخیره‌ی یادداشت ناموفق بود.");
    } finally {
      setSavingNote(false);
    }
  }

  async function removeNote(date: string) {
    try {
      if (isLoggedIn) {
        await fetch(`/api/calendar/notes/${date}`, { method: "DELETE" });
      } else {
        deleteGuestNote(date);
      }
      if (date === activeDate) setNoteText("");
      loadNotes();
      toast.success("یادداشت حذف شد.");
    } catch {
      toast.error("حذف یادداشت ناموفق بود.");
    }
  }

  // ---------------- آمار ----------------
  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of events) {
      if (e.isHoliday) continue;
      counts[e.category] = (counts[e.category] ?? 0) + 1;
    }
    const max = Math.max(1, ...Object.values(counts));
    return { counts, max, total: Object.values(counts).reduce((a, b) => a + b, 0) };
  }, [events]);

  return (
    <aside className="sb-wrap">
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

      <div className="sb-card">
        <div className="sb-card-head"><NotebookPen size={14} /> یادداشت‌های من</div>

        <div className="sb-note-editor">
          <span className="sb-note-editor-date">یادداشت {formatJalali(new Date(activeDate + "T00:00:00"), false)}</span>
          <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="یادداشت یا خاطره‌ی این روز را بنویسید..." rows={3} />
          <button className="sb-note-save" onClick={saveNote} disabled={savingNote}>
            {savingNote ? "در حال ذخیره..." : "ذخیره‌ی یادداشت"}
          </button>
        </div>

        {notes.length > 0 && (
          <ul className="sb-note-list">
            {notes
              .sort((a, b) => (a.date < b.date ? 1 : -1))
              .map((n) => (
                <li key={n.date}>
                  <div className="sb-note-info" onClick={() => openNoteForEdit(n)}>
                    <span className="sb-note-date">{formatJalali(new Date(n.date + "T00:00:00"), false)}</span>
                    <span className="sb-note-preview">{n.content.slice(0, 40)}</span>
                  </div>
                  <div className="sb-ev-actions">
                    <button onClick={() => openNoteForEdit(n)} aria-label="ویرایش"><Pencil size={12} /></button>
                    <button onClick={() => removeNote(n.date)} aria-label="حذف" className="danger"><Trash2 size={12} /></button>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </div>

      <div className="sb-card">
        <div className="sb-card-head"><BarChart3 size={14} /> آمار رویدادهای بازه‌ی جاری</div>
        {stats.total === 0 ? (
          <p className="sb-empty">هنوز رویدادی ثبت نشده.</p>
        ) : (
          <div className="sb-stats">
            {Object.entries(stats.counts).map(([cat, count]) => (
              <div key={cat} className="sb-stat-row">
                <span className="sb-stat-label">{CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] ?? cat}</span>
                <div className="sb-stat-bar-bg">
                  <div className="sb-stat-bar" style={{ width: `${(count / stats.max) * 100}%`, background: CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS] ?? "#16a34a" }} />
                </div>
                <span className="sb-stat-count">{count.toLocaleString("fa-IR")}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .sb-wrap { display: flex; flex-direction: column; gap: 12px; }
        .sb-card { background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08); border-radius: 14px; padding: 14px; }
        .sb-card-head { display: flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 700; color: #fbbf24; margin-bottom: 10px; }
        .sb-card-head-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
        .sb-add-mini { display: flex; align-items: center; gap: 3px; background: rgba(251,191,36,.15); color: #fbbf24; border: none; border-radius: 999px; padding: 4px 10px; font-size: 10.5px; font-weight: 700; cursor: pointer; }
        .sb-empty { font-size: 11.5px; color: #6b7280; }

        .sb-event-list, .sb-note-list { list-style: none; margin: 10px 0 0; padding: 0; display: flex; flex-direction: column; gap: 6px; max-height: 260px; overflow-y: auto; }
        .sb-event-list li { display: flex; align-items: center; justify-content: space-between; gap: 6px; background: rgba(255,255,255,.03); border-inline-start: 3px solid; border-radius: 8px; padding: 7px 10px; font-size: 12px; }
        .sb-event-list li:hover { background: rgba(255,255,255,.07); }
        .sb-ev-info { display: flex; flex-direction: column; cursor: pointer; overflow: hidden; flex: 1; }
        .sb-ev-title { color: #e5e7eb; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .sb-ev-date { color: #6b7280; font-size: 10.5px; white-space: nowrap; }
        .sb-ev-actions { display: flex; gap: 4px; flex-shrink: 0; }
        .sb-ev-actions button { background: rgba(255,255,255,.06); border: none; color: #d1d5db; width: 24px; height: 24px; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .sb-ev-actions button:hover { background: rgba(255,255,255,.15); }
        .sb-ev-actions button.danger:hover { background: rgba(239,68,68,.25); color: #f87171; }

        .sb-note-editor { display: flex; flex-direction: column; gap: 6px; }
        .sb-note-editor-date { font-size: 11px; color: #9ca3af; }
        .sb-note-editor textarea { width: 100%; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); border-radius: 10px; padding: 8px 10px; color: #fff; font-size: 12px; resize: vertical; outline: none; font-family: inherit; }
        .sb-note-editor textarea:focus { border-color: #fbbf24; }
        .sb-note-save { width: 100%; background: linear-gradient(135deg, #16a34a, #ca8a04); color: #fff; border: none; border-radius: 10px; padding: 8px; font-size: 12px; font-weight: 700; cursor: pointer; }
        .sb-note-save:disabled { opacity: .6; cursor: default; }

        .sb-note-list li { display: flex; align-items: center; justify-content: space-between; gap: 6px; background: rgba(255,255,255,.03); border-radius: 8px; padding: 7px 10px; }
        .sb-note-list li:hover { background: rgba(255,255,255,.07); }
        .sb-note-info { display: flex; flex-direction: column; gap: 2px; cursor: pointer; overflow: hidden; flex: 1; }
        .sb-note-date { font-size: 10.5px; color: #fbbf24; font-weight: 700; }
        .sb-note-preview { font-size: 11px; color: #9ca3af; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        .sb-stats { display: flex; flex-direction: column; gap: 8px; }
        .sb-stat-row { display: flex; align-items: center; gap: 8px; font-size: 11px; }
        .sb-stat-label { width: 56px; color: #9ca3af; flex-shrink: 0; }
        .sb-stat-bar-bg { flex: 1; height: 8px; border-radius: 999px; background: rgba(255,255,255,.06); overflow: hidden; }
        .sb-stat-bar { height: 100%; border-radius: 999px; }
        .sb-stat-count { color: #e5e7eb; font-weight: 700; width: 18px; text-align: left; }
      `}</style>
    </aside>
  );
}
