"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { searchCompareProducts, type CompareSuggestion } from "@/app/(shop)/compare/actions";

interface Slot {
  text: string;
  selected: CompareSuggestion | null;
}

const SLOT_COUNT = 4;

function initialSlots(initial: CompareSuggestion[]): Slot[] {
  return Array.from({ length: SLOT_COUNT }, (_, i) =>
    initial[i] ? { text: initial[i].name, selected: initial[i] } : { text: "", selected: null }
  );
}

export default function CompareForm({ initial }: { initial: CompareSuggestion[] }) {
  const router = useRouter();
  const [slots, setSlots] = useState<Slot[]>(() => initialSlots(initial));
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<CompareSuggestion[]>([]);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seq = useRef(0);

  function handleChange(index: number, text: string) {
    setSlots((prev) => prev.map((s, i) => (i === index ? { text, selected: null } : s)));
    setActiveIndex(index);
    setError("");
    if (timer.current) clearTimeout(timer.current);
    if (text.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const mySeq = ++seq.current;
    timer.current = setTimeout(async () => {
      const result = await searchCompareProducts(text);
      if (mySeq === seq.current) setSuggestions(result); // نتیجه‌ی قدیمی نادیده گرفته می‌شود
    }, 250);
  }

  function pick(index: number, item: CompareSuggestion) {
    setSlots((prev) => prev.map((s, i) => (i === index ? { text: item.name, selected: item } : s)));
    setSuggestions([]);
    setActiveIndex(null);
  }

  function clearSlot(index: number) {
    setSlots((prev) => prev.map((s, i) => (i === index ? { text: "", selected: null } : s)));
    if (activeIndex === index) setSuggestions([]);
  }

  function submit() {
    setError("");
    startTransition(async () => {
      const slugs: string[] = [];
      for (const slot of slots) {
        const text = slot.text.trim();
        if (!text) continue;
        let slug = slot.selected?.slug;
        if (!slug) {
          // اگر کاربر از لیست پیشنهاد انتخاب نکرده، بهترین نتیجه‌ی همین نام انتخاب می‌شود
          const found = await searchCompareProducts(text);
          slug = found[0]?.slug;
          if (!slug) {
            setError(`محصولی با نام «${text}» پیدا نشد.`);
            return;
          }
        }
        if (!slugs.includes(slug)) slugs.push(slug);
      }
      if (slugs.length < 2) {
        setError("برای مقایسه، نام حداقل دو محصول را وارد کنید.");
        return;
      }
      router.push(`/compare?${slugs.map((s) => `p=${encodeURIComponent(s)}`).join("&")}`);
    });
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <p style={{ fontSize: 13, color: "#4b5563", marginBottom: 12, lineHeight: 1.9 }}>
        نام ۲ تا ۴ محصول را بنویسید و از لیست پیشنهادی انتخاب کنید، سپس روی «مقایسه» بزنید.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        {slots.map((slot, i) => (
          <div key={i} style={{ position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid #d1d5db", borderRadius: 10, padding: "6px 10px", background: "#fff" }}>
              {slot.selected?.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={slot.selected.image} alt="" width={28} height={28} style={{ objectFit: "contain", borderRadius: 6, flexShrink: 0 }} />
              )}
              <input
                type="text"
                value={slot.text}
                maxLength={80}
                placeholder={`محصول ${i + 1}${i < 2 ? "" : " (اختیاری)"}`}
                onChange={(e) => handleChange(i, e.target.value)}
                onFocus={() => setActiveIndex(i)}
                onBlur={() => setTimeout(() => setActiveIndex((cur) => (cur === i ? null : cur)), 150)}
                style={{ flex: 1, minWidth: 0, border: "none", outline: "none", fontSize: 13, fontFamily: "inherit", background: "transparent", color: "#111827" }}
              />
              {slot.text && (
                <button type="button" onClick={() => clearSlot(i)} aria-label="پاک کردن" style={{ border: "none", background: "transparent", cursor: "pointer", color: "#6b7280", fontSize: 14, padding: 0 }}>
                  ✕
                </button>
              )}
            </div>

            {activeIndex === i && suggestions.length > 0 && (
              <ul
                style={{
                  position: "absolute", top: "calc(100% + 4px)", right: 0, left: 0, zIndex: 20, margin: 0, padding: 4,
                  listStyle: "none", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.15)", maxHeight: 280, overflowY: "auto",
                }}
              >
                {suggestions.map((s) => (
                  <li key={s.slug}>
                    <button
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); pick(i, s); }}
                      style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "right", border: "none", background: "transparent", cursor: "pointer", padding: "6px 8px", borderRadius: 8, fontSize: 12.5, fontFamily: "inherit", color: "#111827" }}
                    >
                      {s.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.image} alt="" width={32} height={32} style={{ objectFit: "contain", borderRadius: 6, flexShrink: 0 }} />
                      ) : (
                        <span style={{ width: 32, height: 32, flexShrink: 0 }} />
                      )}
                      <span>{s.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {error && <p style={{ color: "#dc2626", fontSize: 13, marginTop: 10 }}>{error}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={pending}
        style={{ marginTop: 14, background: "#16a34a", color: "#fff", border: "none", borderRadius: 10, padding: "9px 28px", fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", opacity: pending ? 0.6 : 1 }}
      >
        {pending ? "در حال بررسی..." : "مقایسه"}
      </button>
    </div>
  );
}