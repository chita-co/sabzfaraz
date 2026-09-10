"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { CALENDAR_FAQS } from "./calendarFaqs";

export default function CalendarFaqAccordion() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="cfa-wrap">
      <div className="cfa-inner">
        <h2>درباره‌ی تقویم و رویدادها</h2>
        <div className="cfa-list">
          {CALENDAR_FAQS.map((item, i) => (
            <div key={item.q} className="cfa-item">
              <button className="cfa-q" onClick={() => setOpen(open === i ? null : i)}>
                <span>{item.q}</span>
                <ChevronDown size={18} className={open === i ? "cfa-icon open" : "cfa-icon"} />
              </button>
              {open === i && <p className="cfa-a">{item.a}</p>}
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .cfa-wrap { background: transparent; padding: 8px 16px 56px; position: relative; z-index: 1; }
        .cfa-inner { max-width: 860px; margin: 0 auto; }
        .cfa-wrap h2 { font-size: 20px; font-weight: 800; color: #fff; margin-bottom: 16px; }
        .cfa-list { display: flex; flex-direction: column; gap: 10px; }
        .cfa-item { background: rgba(255,255,255,.07); backdrop-filter: blur(6px); border: 1px solid rgba(255,255,255,.12); border-radius: 12px; padding: 4px 16px; }
        .cfa-q { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 10px; background: none; border: none; padding: 14px 0; text-align: right; font-size: 14.5px; font-weight: 700; color: #fff; cursor: pointer; }
        .cfa-icon { transition: transform .2s; color: #9ca3af; flex-shrink: 0; }
        .cfa-icon.open { transform: rotate(180deg); }
        .cfa-a { font-size: 13.5px; color: #d1d5db; line-height: 2; padding-bottom: 16px; margin: 0; }
      `}</style>
    </section>
  );
}