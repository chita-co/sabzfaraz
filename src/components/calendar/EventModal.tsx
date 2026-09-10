"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Trash2, Share2, Download, CalendarPlus } from "lucide-react";
import toast from "react-hot-toast";
import type { CalendarEvent, EventCategory, RecurrenceFreq } from "@/types/calendar";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/types/calendar";
import { buildGoogleCalendarUrl, downloadIcsFile } from "@/lib/calendar/ics";

const REMINDER_OPTIONS = [
  { value: 10, label: "۱۰ دقیقه قبل" },
  { value: 30, label: "۳۰ دقیقه قبل" },
  { value: 60, label: "۱ ساعت قبل" },
  { value: 1440, label: "۱ روز قبل" },
];

function toDateTimeLocal(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EventModal({
  mode, event, defaultDate, onClose, onSave, onDelete,
}: {
  mode: "create" | "edit";
  event?: CalendarEvent;
  defaultDate?: Date;
  onClose: () => void;
  onSave: (payload: Partial<CalendarEvent>, existing?: CalendarEvent) => void;
  onDelete?: () => void;
}) {
  const initialStart = event?.startAt ?? (defaultDate ? defaultDate.toISOString() : new Date().toISOString());
  const initialEnd = event?.endAt ?? initialStart;

  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [category, setCategory] = useState<EventCategory>(event?.category ?? "personal");
  const [color, setColor] = useState(event?.color ?? CATEGORY_COLORS.personal);
  const [location, setLocation] = useState(event?.location ?? "");
  const [url, setUrl] = useState(event?.url ?? "");
  const [allDay, setAllDay] = useState(event?.allDay ?? false);
  const [startAt, setStartAt] = useState(toDateTimeLocal(initialStart));
  const [endAt, setEndAt] = useState(toDateTimeLocal(initialEnd));
  const [recurFreq, setRecurFreq] = useState<RecurrenceFreq | "none">(event?.recurrence?.freq ?? "none");
  const [recurInterval, setRecurInterval] = useState(event?.recurrence?.interval ?? 1);
  const [recurUntil, setRecurUntil] = useState(event?.recurrence?.until?.slice(0, 10) ?? "");
  const [reminders, setReminders] = useState<number[]>(event?.remindersMinutes ?? []);
  const [saving, setSaving] = useState(false);

  const isHolidayReadonly = !!event?.isHoliday;
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = "";
    };
  }, []);

  function toggleReminder(mins: number) {
    setReminders((prev) => (prev.includes(mins) ? prev.filter((m) => m !== mins) : [...prev, mins]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { toast.error("عنوان رویداد الزامی است."); return; }
    setSaving(true);
    const payload: Partial<CalendarEvent> = {
      title: title.trim(),
      description: description.trim() || null,
      category,
      color,
      location: location.trim() || null,
      url: url.trim() || null,
      allDay,
      startAt: new Date(startAt).toISOString(),
      endAt: new Date(endAt || startAt).toISOString(),
      recurrence: recurFreq === "none" ? null : { freq: recurFreq, interval: Math.max(1, recurInterval), until: recurUntil ? new Date(recurUntil).toISOString() : undefined },
      remindersMinutes: reminders,
    };
    await onSave(payload, event);
    setSaving(false);
  }

  function previewEventForExport(): CalendarEvent {
    return {
      id: event?.id ?? "preview",
      userId: null,
      title: title.trim() || "رویداد بدون عنوان",
      description: description || null,
      category,
      color,
      location: location || null,
      url: url || null,
      startAt: new Date(startAt).toISOString(),
      endAt: new Date(endAt || startAt).toISOString(),
      allDay,
      remindersMinutes: reminders,
      isHoliday: false,
    };
  }

  function copyShareLink() {
    if (!event) return;
    const link = `${window.location.origin}/calendar/event/${event.id}`;
    navigator.clipboard.writeText(link).then(() => toast.success("لینک اشتراک‌گذاری کپی شد."));
  }

  if (!mounted) return null;

  return createPortal(
    <div className="em-overlay" onClick={onClose}>
      <form className="em-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div className="em-head">
          <h3>{mode === "create" ? "رویداد جدید" : isHolidayReadonly ? "جزئیات مناسبت" : "ویرایش رویداد"}</h3>
          <button type="button" className="em-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="em-body">
          <label className="em-field">
            عنوان
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان رویداد" required disabled={isHolidayReadonly} />
          </label>

          <label className="em-field">
            توضیحات
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} disabled={isHolidayReadonly} />
          </label>

          <div className="em-row">
            <label className="em-field">
              دسته‌بندی
              <select
                value={category}
                onChange={(e) => {
                  const c = e.target.value as EventCategory;
                  setCategory(c);
                  setColor(CATEGORY_COLORS[c]);
                }}
                disabled={isHolidayReadonly}
              >
                {Object.entries(CATEGORY_LABELS).map(([k, l]) => (
                  <option key={k} value={k}>{l}</option>
                ))}
              </select>
            </label>
            <label className="em-field em-color-field">
              رنگ
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} disabled={isHolidayReadonly} />
            </label>
          </div>

          <label className="em-check">
            <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} disabled={isHolidayReadonly} />
            تمام روز
          </label>

          <div className="em-row">
            <label className="em-field">
              شروع
              <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} disabled={isHolidayReadonly} />
            </label>
            <label className="em-field">
              پایان
              <input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} disabled={isHolidayReadonly} />
            </label>
          </div>

          <div className="em-row">
            <label className="em-field">
              مکان (اختیاری)
              <input value={location} onChange={(e) => setLocation(e.target.value)} disabled={isHolidayReadonly} />
            </label>
            <label className="em-field">
              لینک (اختیاری)
              <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" disabled={isHolidayReadonly} />
            </label>
          </div>

          {!isHolidayReadonly && (
            <>
              <div className="em-row">
                <label className="em-field">
                  تکرار
                  <select value={recurFreq} onChange={(e) => setRecurFreq(e.target.value as RecurrenceFreq | "none")}>
                    <option value="none">بدون تکرار</option>
                    <option value="daily">روزانه</option>
                    <option value="weekly">هفتگی</option>
                    <option value="monthly">ماهانه</option>
                    <option value="yearly">سالانه</option>
                  </select>
                </label>
                {recurFreq !== "none" && (
                  <label className="em-field">
                    هر چند بار
                    <input type="number" min={1} value={recurInterval} onChange={(e) => setRecurInterval(Number(e.target.value))} />
                  </label>
                )}
              </div>
              {recurFreq !== "none" && (
                <label className="em-field">
                  پایان تکرار (اختیاری)
                  <input type="date" value={recurUntil} onChange={(e) => setRecurUntil(e.target.value)} />
                </label>
              )}

              <div className="em-field">
                یادآوری
                <div className="em-reminder-chips">
                  {REMINDER_OPTIONS.map((r) => (
                    <button
                      type="button"
                      key={r.value}
                      className={reminders.includes(r.value) ? "active" : ""}
                      onClick={() => toggleReminder(r.value)}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="em-export-row">
            <button type="button" className="em-export-btn" onClick={() => window.open(buildGoogleCalendarUrl(previewEventForExport()), "_blank")}>
              <CalendarPlus size={13} /> گوگل‌کلندر
            </button>
            <button type="button" className="em-export-btn" onClick={() => downloadIcsFile(previewEventForExport(), window.location.origin)}>
              <Download size={13} /> دانلود ICS
            </button>
            {event && !isHolidayReadonly && (
              <button type="button" className="em-export-btn" onClick={copyShareLink}>
                <Share2 size={13} /> اشتراک‌گذاری
              </button>
            )}
          </div>
        </div>

        {!isHolidayReadonly && (
          <div className="em-footer">
            {onDelete && (
              <button type="button" className="em-delete" onClick={onDelete}>
                <Trash2 size={14} /> حذف
              </button>
            )}
            <button type="submit" className="em-save" disabled={saving}>
              {saving ? "در حال ذخیره..." : mode === "create" ? "ثبت رویداد" : "ذخیره‌ی تغییرات"}
            </button>
          </div>
        )}

        <style jsx>{`
          .em-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.6); backdrop-filter: blur(3px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; }
          .em-modal { background: #14231a; border: 1px solid rgba(255,255,255,.1); border-radius: 18px; width: 100%; max-width: 620px; max-height: 92vh; display: flex; flex-direction: column; }
          .em-head { display: flex; align-items: center; justify-content: space-between; padding: 16px 18px; border-bottom: 1px solid rgba(255,255,255,.08); }
          .em-head h3 { font-size: 15px; font-weight: 800; color: #fff; margin: 0; }
          .em-close { background: none; border: none; color: #9ca3af; cursor: pointer; }
          .em-body { padding: 16px 18px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; }
          .em-field { display: flex; flex-direction: column; gap: 5px; font-size: 11.5px; color: #9ca3af; flex: 1; }
          .em-color-field { flex: 0 0 60px; }
          .em-row { display: flex; gap: 10px; }
          .em-field input, .em-field select, .em-field textarea {
            background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.14); color: #fff;
            border-radius: 9px; padding: 8px 10px; font-size: 13px; outline: none; font-family: inherit;
          }
          .em-field input:disabled, .em-field select:disabled, .em-field textarea:disabled { opacity: .6; }
          .em-field input:focus, .em-field select:focus, .em-field textarea:focus { border-color: #fbbf24; }
          .em-field select option { color: #111827; }
          .em-field input[type="color"] { padding: 2px; height: 34px; cursor: pointer; }
          .em-check { display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: #d1d5db; }
          .em-reminder-chips { display: flex; flex-wrap: wrap; gap: 6px; }
          .em-reminder-chips button { background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12); color: #d1d5db; border-radius: 999px; padding: 5px 12px; font-size: 11px; cursor: pointer; }
          .em-reminder-chips button.active { background: #fbbf24; color: #14532d; border-color: #fbbf24; font-weight: 700; }
          .em-export-row { display: flex; gap: 6px; flex-wrap: wrap; padding-top: 4px; border-top: 1px dashed rgba(255,255,255,.1); }
          .em-export-btn { display: flex; align-items: center; gap: 5px; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1); color: #d1d5db; border-radius: 8px; padding: 6px 10px; font-size: 11px; cursor: pointer; }
          .em-export-btn:hover { background: rgba(255,255,255,.1); }
          .em-footer { display: flex; gap: 8px; padding: 14px 18px; border-top: 1px solid rgba(255,255,255,.08); }
          .em-delete { display: flex; align-items: center; gap: 5px; background: rgba(239,68,68,.15); color: #f87171; border: none; border-radius: 10px; padding: 9px 14px; font-size: 12.5px; font-weight: 700; cursor: pointer; }
          .em-save { flex: 1; background: linear-gradient(135deg, #16a34a, #ca8a04); color: #fff; border: none; border-radius: 10px; padding: 9px; font-size: 13px; font-weight: 800; cursor: pointer; }
          .em-save:disabled { opacity: .6; }
        `}</style>
      </form>
    </div>,
    document.body
  );
}
