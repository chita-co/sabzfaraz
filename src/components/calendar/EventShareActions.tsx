"use client";

import { Download, Link2, Check } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import type { CalendarEvent } from "@/types/calendar";
import { downloadIcsFile } from "@/lib/calendar/ics";

export default function EventShareActions({ event }: { event: CalendarEvent }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("لینک کپی شد.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("کپی لینک ناموفق بود.");
    }
  }

  return (
    <div className="esa-row">
      <button className="esa-btn" onClick={() => downloadIcsFile(event, window.location.origin)}>
        <Download size={14} /> دانلود ICS
      </button>
      <button className="esa-btn" onClick={copyLink}>
        {copied ? <Check size={14} /> : <Link2 size={14} />} کپی لینک
      </button>
      <style jsx>{`
        .esa-row { display: flex; gap: 8px; flex-wrap: wrap; }
        .esa-btn { display: flex; align-items: center; gap: 6px; background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.14); color: #e5e7eb; border-radius: 10px; padding: 8px 14px; font-size: 12.5px; cursor: pointer; }
        .esa-btn:hover { background: rgba(255,255,255,.14); }
      `}</style>
    </div>
  );
}
