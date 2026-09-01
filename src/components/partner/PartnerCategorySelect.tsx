"use client";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";
import type { PartnerCategoryOption } from "@/types/partner";

export default function PartnerCategorySelect({
  categories, value, onChange,
}: { categories: PartnerCategoryOption[]; value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = categories.find((c) => c.id === value);
  const filtered = categories.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="partner-input" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", cursor: "pointer" }}>
        <span style={{ color: selected ? "#111827" : "#9ca3af" }}>{selected ? selected.name : "انتخاب دسته‌بندی..."}</span>
        <ChevronDown size={15} style={{ transform: open ? "rotate(180deg)" : "none", transition: ".2s" }} />
      </button>
      {open && (
        <div style={{ position: "absolute", top: "100%", right: 0, left: 0, zIndex: 30, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, marginTop: 4, boxShadow: "0 10px 30px rgba(0,0,0,.1)", maxHeight: 260, overflowY: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", borderBottom: "1px solid #f3f4f6", position: "sticky", top: 0, background: "#fff" }}>
            <Search size={14} color="#9ca3af" />
            <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="جستجوی دسته‌بندی..." style={{ border: "none", outline: "none", fontSize: 13, width: "100%" }} />
          </div>
          {filtered.map((c) => (
            <button key={c.id} type="button" onClick={() => { onChange(c.id); setOpen(false); setQuery(""); }} style={{ display: "block", width: "100%", textAlign: "right", padding: "9px 12px", fontSize: 13, border: "none", background: c.id === value ? "#f0fdf4" : "transparent", color: c.id === value ? "#16a34a" : "#374151", cursor: "pointer" }}>
              {c.name}
            </button>
          ))}
          {filtered.length === 0 && <p style={{ padding: 12, fontSize: 12, color: "#9ca3af", textAlign: "center" }}>موردی یافت نشد.</p>}
        </div>
      )}
    </div>
  );
}