"use client";

import { useState } from "react";
import { updateGeneralSettings } from "@/app/admin/settings/actions";

export default function GeneralSettingsForm({
  initial,
}: {
  initial: { store_name: string; support_phone: string | null; support_email: string | null; store_address: string | null; about_content: string | null };
}) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const formData = new FormData(e.currentTarget);
    await updateGeneralSettings(formData);
    setSaving(false);
    setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit} className="admin-card" style={{ maxWidth: 520 }}>
      <h1 className="text-xl font-bold text-gray-900 mb-6">تنظیمات عمومی فروشگاه</h1>

      <div className="admin-form-group">
        <label>نام فروشگاه</label>
        <input type="text" name="storeName" defaultValue={initial.store_name} required />
      </div>
      <div className="admin-form-group">
        <label>تلفن پشتیبانی</label>
        <input type="text" name="supportPhone" dir="ltr" defaultValue={initial.support_phone ?? ""} placeholder="021-00000000" />
      </div>
      <div className="admin-form-group">
        <label>ایمیل پشتیبانی</label>
        <input type="email" name="supportEmail" dir="ltr" defaultValue={initial.support_email ?? ""} placeholder="support@sabzfaraz.ir" />
      </div>
      <div className="admin-form-group">
        <label>آدرس فروشگاه</label>
        <textarea name="storeAddress" rows={3} defaultValue={initial.store_address ?? ""} placeholder="ایران، تهران" />
      </div>
      <div className="admin-form-group">
        <label>متن صفحه‌ی «درباره ما»</label>
        <textarea
          name="aboutContent"
          rows={6}
          defaultValue={initial.about_content ?? ""}
          placeholder="هر متنی اینجا بنویسید، دقیقاً همین متن در صفحه‌ی درباره‌ی ما نمایش داده می‌شود."
        />
      </div>

      {saved && <p className="text-green-600 text-sm mb-3">ذخیره شد — در فوتر و صفحه‌ی تماس با ما به‌روز شد.</p>}

      <button type="submit" disabled={saving} className="admin-btn admin-btn-primary">
        {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
      </button>
    </form>
  );
}