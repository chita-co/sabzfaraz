"use client";

import { useState } from "react";
import { savePostalTrackingCodeAction } from "@/app/admin/orders/actions";

export default function PostalTrackingCodeForm({
  orderId,
  initialCode,
}: {
  orderId: string;
  initialCode: string | null;
}) {
  const [code, setCode] = useState(initialCode ?? "");
  const [savedCode, setSavedCode] = useState(initialCode);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!code.trim()) return alert("کد رهگیری را وارد کنید.");
    setSaving(true);
    const result = await savePostalTrackingCodeAction(orderId, code.trim());
    setSaving(false);
    if (result?.error) return alert(result.error);
    setSavedCode(code.trim());
  }

  return (
    <div className="admin-form-group no-print" style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #f1f5f9" }}>
      <label>کد رهگیری پستی مرسوله</label>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          dir="ltr"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="مثلاً 89012345678901"
          disabled={saving}
        />
        <button type="button" onClick={handleSave} disabled={saving} className="admin-btn admin-btn-primary">
          {saving ? "در حال ثبت..." : "ثبت"}
        </button>
      </div>
      {savedCode && (
        <p style={{ fontSize: 11.5, color: "#16a34a", marginTop: 6 }}>
          کد رهگیری ثبت شده: <span dir="ltr">{savedCode}</span> — پیامک اطلاع‌رسانی برای مشتری ارسال شد.
        </p>
      )}
    </div>
  );
}