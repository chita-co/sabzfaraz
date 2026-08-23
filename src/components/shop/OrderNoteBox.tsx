"use client";

import { useState, useEffect } from "react";
import { StickyNote, Check } from "lucide-react";
import { useCartStore } from "@/store/cart-store";

export default function OrderNoteBox() {
  const storeNote = useCartStore((s) => s.orderNote);
  const setOrderNote = useCartStore((s) => s.setOrderNote);
  const [localNote, setLocalNote] = useState(storeNote);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLocalNote(storeNote), 0);
    return () => clearTimeout(timer);
  }, [storeNote]);

  function handleSave() {
    setOrderNote(localNote.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="order-note-box">
      <div className="order-note-header">
        <StickyNote size={16} />
        <h3>توضیحات سفارش (اختیاری)</h3>
      </div>
      <textarea
        rows={3}
        placeholder="اگر نکته‌ای درباره‌ی محصولات یا نحوه‌ی ارسال دارید، اینجا بنویسید..."
        value={localNote}
        onChange={(e) => setLocalNote(e.target.value)}
      />
      <button type="button" onClick={handleSave} className="order-note-save-btn">
        {saved ? <><Check size={14} /> ذخیره شد</> : "ثبت توضیحات"}
      </button>
    </div>
  );
}