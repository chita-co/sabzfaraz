"use client";

import { useState } from "react";
import { updateAnnouncementSettings } from "@/app/admin/settings/actions";

export default function AnnouncementSettingsForm({
  initial,
}: {
  initial: { enabled: boolean; text1: string; text2: string };
}) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const res = await updateAnnouncementSettings(new FormData(e.currentTarget));
    setSaving(false);
    if (res && "error" in res && res.error) setMessage({ type: "err", text: res.error });
    else setMessage({ type: "ok", text: "ذخیره شد — اطلاعیه‌ها در بالای سایت به‌روز شدند." });
  }

  return (
    <form onSubmit={handleSubmit} className="admin-card" style={{ maxWidth: 520 }}>
      <h2 className="text-lg font-bold text-gray-900 mb-4">اطلاعیه‌های بالای سایت</h2>

      <div className="admin-form-group">
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input type="checkbox" name="enabled" defaultChecked={initial.enabled} style={{ width: 18, height: 18 }} />
          نمایش اطلاعیه‌ها (با خاموش‌کردن، هر دو باکس از سایت برداشته می‌شوند)
        </label>
      </div>

      <div className="admin-form-group">
        <label>
          <span style={{ background: "#15803d", color: "#fff", borderRadius: 6, padding: "1px 8px", marginLeft: 6 }}>سبز</span>
          متن اطلاعیه‌ی اول (خالی بگذارید تا این باکس نمایش داده نشود)
        </label>
        <input type="text" name="text1" maxLength={200} defaultValue={initial.text1} placeholder="مثلاً: موجودی و قیمت کالا ها بروز می باشد." />
      </div>

      <div className="admin-form-group">
        <label>
          <span style={{ background: "#fbbf24", color: "#111827", borderRadius: 6, padding: "1px 8px", marginLeft: 6 }}>طلایی</span>
          متن اطلاعیه‌ی دوم (خالی بگذارید تا این باکس نمایش داده نشود)
        </label>
        <input type="text" name="text2" maxLength={200} defaultValue={initial.text2} placeholder="مثلاً: ارسال پستی در روز های فرد انجام می شود" />
      </div>

      {message && (
        <p className={`${message.type === "ok" ? "text-green-600" : "text-red-600"} text-sm mb-3`}>{message.text}</p>
      )}

      <button type="submit" disabled={saving} className="admin-btn admin-btn-primary">
        {saving ? "در حال ذخیره..." : "ذخیره اطلاعیه‌ها"}
      </button>
    </form>
  );
}