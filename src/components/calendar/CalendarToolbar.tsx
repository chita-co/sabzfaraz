"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRight, ChevronLeft, Plus, Search, CalendarDays } from "lucide-react";
import { JALALI_MONTH_NAMES, toJalali, fromJalali } from "@/lib/calendar/jalali";
import { CATEGORY_LABELS, type CalendarViewMode, type EventCategory } from "@/types/calendar";

/* eslint-disable react-hooks/refs */

const VIEWS: { key: CalendarViewMode; label: string }[] = [
  { key: "day", label: "روزانه" },
  { key: "week", label: "هفتگی" },
  { key: "month", label: "ماهانه" },
  { key: "year", label: "سالانه" },
];

// بازه‌ی سال‌های قابل‌انتخاب — از ۲۰ سال قبل تا ۲۰ سال بعدِ سالِ جاری، به‌صورت
// یک پنل اسکرول‌دار (نه یک select کوچک) تا هم درست و هم حرفه‌ای به‌نظر بیاید
function buildYearRange(centerJy: number): number[] {
  const start = centerJy - 50;
  return Array.from({ length: 71 }, (_, i) => start + i);
}

function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);
  return { open, setOpen, ref };
}

export default function CalendarToolbar({
  currentDate, viewMode, onViewModeChange, onPrev, onNext, onToday, onJump, onAddEvent,
  search, onSearchChange, categoryFilter, onCategoryFilterChange,
}: {
  currentDate: Date;
  viewMode: CalendarViewMode;
  onViewModeChange: (v: CalendarViewMode) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onJump: (d: Date) => void;
  onAddEvent: () => void;
  search: string;
  onSearchChange: (v: string) => void;
  categoryFilter: EventCategory | "all";
  onCategoryFilterChange: (v: EventCategory | "all") => void;
}) {
  const { jy, jm } = toJalali(currentDate);
  const todayJalali = toJalali(new Date());
  const monthPop = usePopover();
  const yearPop = usePopover();
  const years = buildYearRange(todayJalali.jy);

  function handleMonthChange(newJm: number) {
    onJump(fromJalali(jy, newJm, 1));
    monthPop.setOpen(false);
  }
  function handleYearChange(newJy: number) {
    onJump(fromJalali(newJy, jm, 1));
    yearPop.setOpen(false);
  }

  return (
    <div className="ctb-wrap">
      <div className="ctb-inner">
        <div className="ctb-row">
          <div className="ctb-nav">
            <button onClick={onPrev} aria-label="قبلی"><ChevronRight size={18} /></button>
            <button className="ctb-today" onClick={onToday}>
              امروز <span className="ctb-today-num">{todayJalali.jd.toLocaleString("fa-IR")}</span>
            </button>
            <button onClick={onNext} aria-label="بعدی"><ChevronLeft size={18} /></button>
          </div>

          <div className="ctb-period">
            <CalendarDays size={16} />

            <div className="ctb-select-pop" ref={monthPop.ref}>
              <button type="button" className="ctb-select-trigger" onClick={() => monthPop.setOpen((v) => !v)}>
                {JALALI_MONTH_NAMES[jm - 1]}
              </button>
              {monthPop.open && (
                <div className="ctb-pop-panel">
                  {JALALI_MONTH_NAMES.map((m, i) => (
                    <button
                      key={m}
                      type="button"
                      className={i + 1 === jm ? "active" : ""}
                      onClick={() => handleMonthChange(i + 1)}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="ctb-select-pop" ref={yearPop.ref}>
              <button type="button" className="ctb-select-trigger" onClick={() => yearPop.setOpen((v) => !v)}>
                {jy.toLocaleString("fa-IR", { useGrouping: false })}
              </button>
              {yearPop.open && (
                <div className="ctb-pop-panel ctb-pop-scroll">
                  {years.map((y) => (
                    <button
                      key={y}
                      type="button"
                      className={y === jy ? "active" : ""}
                      onClick={() => handleYearChange(y)}
                    >
                      {y.toLocaleString("fa-IR", { useGrouping: false })}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="ctb-views">
            {VIEWS.map((v) => (
              <button key={v.key} className={viewMode === v.key ? "active" : ""} onClick={() => onViewModeChange(v.key)}>
                {v.label}
              </button>
            ))}
          </div>

          <button className="ctb-add" onClick={onAddEvent}>
            <Plus size={16} /> رویداد جدید
          </button>
        </div>

        <div className="ctb-row ctb-filters">
          <div className="ctb-search">
            <Search size={14} />
            <input placeholder="جستجوی رویداد..." value={search} onChange={(e) => onSearchChange(e.target.value)} />
          </div>
          <select value={categoryFilter} onChange={(e) => onCategoryFilterChange(e.target.value as EventCategory | "all")}>
            <option value="all">همه‌ی دسته‌ها</option>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <style jsx>{`
        .ctb-wrap { max-width: 1300px; margin: 0 auto; padding: 14px 16px 0; position: relative; z-index: 5; }
        .ctb-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 10px; }
        .ctb-nav { display: flex; align-items: center; gap: 4px; background: rgba(255,255,255,.06); border-radius: 999px; padding: 4px; }
        .ctb-nav button { background: none; border: none; color: #e5e7eb; width: 30px; height: 30px; border-radius: 999px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .ctb-nav button:hover { background: rgba(255,255,255,.1); }
        .ctb-today { width: auto !important; padding: 0 12px; font-size: 12.5px; font-weight: 700; display: flex; align-items: center; gap: 6px; }
        .ctb-today-num { background: #fbbf24; color: #14532d; border-radius: 999px; min-width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 900; padding: 0 4px; }
        .ctb-period { display: flex; align-items: center; gap: 6px; color: #fbbf24; background: rgba(255,255,255,.05); border-radius: 10px; padding: 4px 10px; }

        .ctb-select-pop { position: relative; }
        .ctb-select-trigger { background: transparent; border: none; color: #fbbf24; font-weight: 700; font-size: 13.5px; cursor: pointer; padding: 4px 6px; font-family: inherit; }
        .ctb-pop-panel {
          position: absolute; top: calc(100% + 6px); right: 0; z-index: 40;
          background: #14231a; border: 1px solid rgba(255,255,255,.14); border-radius: 12px;
          padding: 6px; display: flex; flex-direction: column; min-width: 120px;
          box-shadow: 0 12px 30px rgba(0,0,0,.5);
        }
        .ctb-pop-scroll { max-height: 220px; overflow-y: auto; }
        .ctb-pop-panel button { background: none; border: none; color: #e5e7eb; text-align: right; padding: 7px 10px; border-radius: 8px; font-size: 12.5px; cursor: pointer; font-family: inherit; }
        .ctb-pop-panel button:hover { background: rgba(255,255,255,.08); }
        .ctb-pop-panel button.active { background: linear-gradient(135deg, #16a34a, #ca8a04); color: #fff; font-weight: 700; }

        .ctb-views { display: flex; gap: 4px; background: rgba(255,255,255,.05); border-radius: 999px; padding: 4px; }
        .ctb-views button { background: none; border: none; color: #d1d5db; font-size: 12px; font-weight: 600; padding: 6px 14px; border-radius: 999px; cursor: pointer; }
        .ctb-views button.active { background: linear-gradient(135deg, #16a34a, #ca8a04); color: #fff; }
        .ctb-add { margin-inline-start: auto; display: flex; align-items: center; gap: 6px; background: linear-gradient(135deg, #ffd700, #eab308); color: #14532d; border: none; border-radius: 999px; padding: 8px 18px; font-size: 12.5px; font-weight: 800; cursor: pointer; }
        .ctb-filters { }
        .ctb-search { display: flex; align-items: center; gap: 6px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); border-radius: 10px; padding: 7px 12px; flex: 1; min-width: 160px; color: #9ca3af; }
        .ctb-search input { flex: 1; background: none; border: none; color: #fff; font-size: 12.5px; outline: none; }
        .ctb-filters select { background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); color: #fff; border-radius: 10px; padding: 7px 12px; font-size: 12.5px; }
        .ctb-filters select option { color: #111827; }

        @media (max-width: 700px) {
          .ctb-add { margin-inline-start: 0; width: 100%; justify-content: center; }
        }
          /* eslint-enable react-hooks/refs */
      `}</style>
    </div>
  );
}
