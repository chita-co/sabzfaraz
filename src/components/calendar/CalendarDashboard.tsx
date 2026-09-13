"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import type { CalendarEvent, CalendarViewMode, EventCategory } from "@/types/calendar";
import { getGuestEvents, addGuestEvent, updateGuestEvent, deleteGuestEvent, makeGuestEventId } from "@/lib/calendar/storage";
import { getHolidaysInRange } from "@/lib/calendar/holidays";
import { toIsoDate } from "@/lib/calendar/jalali";
import LiveClockHeader from "./LiveClockHeader";
import CalendarToolbar from "./CalendarToolbar";
import SeasonalBackground from "./SeasonalBackground";
import MonthView from "./MonthView";
import YearView from "./YearView";
import WeekView from "./WeekView";
import DayView from "./DayView";
import Sidebar from "./Sidebar";
import UpcomingEventsPanel from "./UpcomingEventsPanel";
import EventModal from "./EventModal";

function holidaysToEvents(rangeStart: Date, rangeEnd: Date): CalendarEvent[] {
  return getHolidaysInRange(rangeStart, rangeEnd).map((h, i) => ({
    id: `holiday-${toIsoDate(h.date)}-${i}`,
    userId: null,
    title: h.title,
    category: "holiday" as EventCategory,
    color: h.isHoliday ? "#dc2626" : "#f59e0b",
    startAt: h.date.toISOString(),
    endAt: h.date.toISOString(),
    allDay: true,
    remindersMinutes: [],
    isHoliday: true,
  }));
}

function getVisibleRange(date: Date, view: CalendarViewMode): [Date, Date] {
  if (view === "year") {
    return [new Date(date.getFullYear(), 0, 1), new Date(date.getFullYear(), 11, 31)];
  }
  if (view === "month") {
    return [new Date(date.getFullYear(), date.getMonth() - 1, 1), new Date(date.getFullYear(), date.getMonth() + 2, 0)];
  }
  if (view === "week") {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return [start, end];
  }
  return [new Date(date.getFullYear(), date.getMonth(), date.getDate()), new Date(date.getFullYear(), date.getMonth(), date.getDate())];
}

export default function CalendarDashboard({
  isLoggedIn,
  initialDate,
  initialView = "month",
}: {
  isLoggedIn: boolean;
  initialDate: Date;
  initialView?: CalendarViewMode;
}) {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [viewMode, setViewMode] = useState<CalendarViewMode>(initialView);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<EventCategory | "all">("all");
  const [modal, setModal] = useState<{ mode: "create" | "edit"; event?: CalendarEvent; defaultDate?: Date } | null>(null);
  const [mounted, setMounted] = useState(false);
  const notifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const [rangeStart, rangeEnd] = useMemo(() => getVisibleRange(currentDate, viewMode), [currentDate, viewMode]);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/calendar/events?from=${rangeStart.toISOString()}&to=${rangeEnd.toISOString()}`);
      const data = await res.json();
      const serverEvents: CalendarEvent[] = data.events ?? [];
      const guestEvents = isLoggedIn ? [] : getGuestEvents();
      const holidayEvents = holidaysToEvents(rangeStart, rangeEnd);
      setEvents([...serverEvents, ...guestEvents, ...holidayEvents]);
    } catch {
      toast.error("دریافت رویدادها با مشکل مواجه شد.");
    } finally {
      setLoading(false);
    }
  }, [rangeStart, rangeEnd, isLoggedIn]);

  useEffect(() => {
    const timer = setTimeout(() => loadEvents(), 0);
    return () => clearTimeout(timer);
  }, [loadEvents]);

  // یادآوری‌ها — کاملاً سمت مرورگر (بدون سرور/کرون)، دقیقاً مثل هشدار قیمت در
  // صفحه‌ی قیمت لحظه‌ای: تا وقتی تب باز است هر ۳۰ ثانیه چک می‌شود.
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      for (const ev of events) {
        if (ev.isHoliday || !ev.remindersMinutes?.length) continue;
        const startMs = new Date(ev.startAt).getTime();
        for (const mins of ev.remindersMinutes) {
          const triggerAt = startMs - mins * 60000;
          const key = `${ev.id}-${mins}`;
          if (now >= triggerAt && now < triggerAt + 30000 && !notifiedRef.current.has(key)) {
            notifiedRef.current.add(key);
            if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
              new Notification("یادآوری رویداد سبزفراز", { body: `${ev.title} — ${mins} دقیقه دیگر` });
            } else {
              toast(`یادآوری: ${ev.title}`);
            }
          }
        }
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [events]);

  function goToday() {
    setCurrentDate(new Date());
  }
  function goPrev() {
    const d = new Date(currentDate);
    if (viewMode === "year") d.setFullYear(d.getFullYear() - 1);
    else if (viewMode === "month") d.setMonth(d.getMonth() - 1);
    else if (viewMode === "week") d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  }
  function goNext() {
    const d = new Date(currentDate);
    if (viewMode === "year") d.setFullYear(d.getFullYear() + 1);
    else if (viewMode === "month") d.setMonth(d.getMonth() + 1);
    else if (viewMode === "week") d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  }

  function openCreateModal(defaultDate?: Date) {
    setModal({ mode: "create", defaultDate: defaultDate ?? currentDate });
  }
  function openEditModal(event: CalendarEvent) {
    if (event.isHoliday) return;
    setModal({ mode: "edit", event });
  }

  async function handleSaveEvent(payload: Partial<CalendarEvent>, existing?: CalendarEvent) {
    try {
      if (isLoggedIn) {
        if (existing) {
          const res = await fetch(`/api/calendar/events/${existing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
          if (!res.ok) throw new Error((await res.json()).error);
        } else {
          const res = await fetch("/api/calendar/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
          if (!res.ok) throw new Error((await res.json()).error);
        }
      } else if (existing) {
        updateGuestEvent(existing.id, payload);
      } else {
        addGuestEvent({
          id: makeGuestEventId(),
          userId: null,
          title: payload.title || "بدون عنوان",
          description: payload.description ?? null,
          category: payload.category ?? "personal",
          color: payload.color ?? "#16a34a",
          location: payload.location ?? null,
          url: payload.url ?? null,
          startAt: payload.startAt!,
          endAt: payload.endAt!,
          allDay: !!payload.allDay,
          recurrence: payload.recurrence ?? null,
          remindersMinutes: payload.remindersMinutes ?? [],
          isHoliday: false,
        });
      }
      toast.success(existing ? "رویداد ویرایش شد." : "رویداد ثبت شد.");
      setModal(null);
      loadEvents();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "عملیات ناموفق بود.");
    }
  }

  async function handleDeleteEvent(event: CalendarEvent) {
    try {
      if (isLoggedIn) {
        const res = await fetch(`/api/calendar/events/${event.id}`, { method: "DELETE" });
        if (!res.ok) throw new Error((await res.json()).error);
      } else {
        deleteGuestEvent(event.id);
      }
      toast.success("رویداد حذف شد.");
      setModal(null);
      loadEvents();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حذف ناموفق بود.");
    }
  }

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (categoryFilter !== "all" && e.category !== categoryFilter) return false;
      if (search.trim() && !e.title.toLowerCase().includes(search.trim().toLowerCase())) return false;
      return true;
    });
  }, [events, search, categoryFilter]);

  return (
    <div className="cal-dashboard">
      <LiveClockHeader />

      <CalendarToolbar
        currentDate={currentDate}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onPrev={goPrev}
        onNext={goNext}
        onToday={goToday}
        onJump={setCurrentDate}
        onAddEvent={() => openCreateModal()}
        search={search}
        onSearchChange={setSearch}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
      />

      <div className="cal-body">
        <div className="cal-main">
          <SeasonalBackground date={currentDate} />
          <div className="cal-main-content">
            {loading && <div className="cal-loading-bar" />}
            {viewMode === "month" && (
              <MonthView currentDate={currentDate} events={filteredEvents} onDayClick={openCreateModal} onEventClick={openEditModal} onEventMove={(ev, newDate) => handleSaveEvent({ startAt: shiftDate(ev.startAt, ev.startAt, newDate), endAt: shiftDate(ev.startAt, ev.endAt, newDate) }, ev)} />
            )}
            {viewMode === "year" && <YearView currentDate={currentDate} events={filteredEvents} onMonthClick={(d) => { setCurrentDate(d); setViewMode("month"); }} />}
            {viewMode === "week" && (
              <WeekView currentDate={currentDate} events={filteredEvents} onSlotClick={openCreateModal} onEventClick={openEditModal} />
            )}
            {viewMode === "day" && (
              <DayView currentDate={currentDate} events={filteredEvents} onSlotClick={openCreateModal} onEventClick={openEditModal} />
            )}
          </div>
        </div>

        <Sidebar
          events={filteredEvents}
          currentDate={currentDate}
          onEventClick={openEditModal}
          onDeleteEvent={(ev) => { if (confirm(`رویداد «${ev.title}» حذف شود؟`)) handleDeleteEvent(ev); }}
          onAddEvent={() => openCreateModal()}
          isLoggedIn={isLoggedIn}
        />
      </div>

      <UpcomingEventsPanel events={filteredEvents} onEventClick={openEditModal} onAddEvent={() => openCreateModal()} />

      {mounted && modal && createPortal(
        <EventModal
          mode={modal.mode}
          event={modal.event}
          defaultDate={modal.defaultDate}
          onClose={() => setModal(null)}
          onSave={handleSaveEvent}
          onDelete={modal.event ? () => handleDeleteEvent(modal.event!) : undefined}
        />,
        document.body
      )}

      <style jsx>{`
        .cal-dashboard { background: linear-gradient(135deg, #0f2818 0%, #14532d 45%, #1a4d2e 75%, #3f3010 100%); min-height: 100vh; padding-bottom: 40px; }
        .cal-body { max-width: 1300px; margin: 0 auto; padding: 0 16px; display: grid; grid-template-columns: 1fr 320px; gap: 16px; align-items: start; }
        @media (max-width: 960px) { .cal-body { grid-template-columns: 1fr; } }
        .cal-main { min-width: 0; position: relative; border-radius: 18px; overflow: hidden; }
        .cal-main-content { position: relative; z-index: 1; }
        .cal-loading-bar { position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, #fbbf24, transparent); animation: cal-loading 1.2s linear infinite; z-index: 2; }
        @keyframes cal-loading { from { transform: translateX(-100%); } to { transform: translateX(100%); } }
      `}</style>
    </div>
  );
}

function shiftDate(originalStart: string, target: string, newDay: Date): string {
  const orig = new Date(target);
  const diffDays = Math.round((newDay.setHours(0, 0, 0, 0) - new Date(originalStart).setHours(0, 0, 0, 0)) / 86400000);
  orig.setDate(orig.getDate() + diffDays);
  return orig.toISOString();
}
