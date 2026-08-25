import { createAdminClient } from "@/lib/supabase/admin";
import { updateBlogBotSettingsAction } from "../actions";

export default async function AdminBlogSettingsPage() {
  const admin = createAdminClient();
  const { data: settings } = await admin.from("blog_bot_settings").select("*").eq("id", 1).single();

  return (
    <div className="admin-card" style={{ maxWidth: 640 }}>
      <h1 style={{ fontSize: 18, fontWeight: 800, marginBottom: 18 }}>تنظیمات ربات تولید محتوا</h1>
      <form action={async (formData) => { await updateBlogBotSettingsAction(formData); }} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <label className="admin-switch">
          <input type="checkbox" name="enabled" defaultChecked={settings?.enabled} />
          <span className="admin-switch-track" />
          <span>فعال بودن ربات (بدون این تیک، حتی با اجرای کرون، مقاله‌ای ساخته نمی‌شود)</span>
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          فاصله‌ی اجرا (ساعت — فعلاً فقط نمایشی؛ زمان‌بندی واقعی در vercel.json تنظیم می‌شود)
          <input className="admin-input" type="number" name="interval_hours" defaultValue={settings?.interval_hours ?? 6} />
        </label>

        <div style={{ display: "flex", gap: 12 }}>
          <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            حداقل کلمات
            <input className="admin-input" type="number" name="min_words" defaultValue={settings?.min_words ?? 800} />
          </label>
          <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            حداکثر کلمات
            <input className="admin-input" type="number" name="max_words" defaultValue={settings?.max_words ?? 1400} />
          </label>
        </div>

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          لحن نوشتار
          <input className="admin-input" type="text" name="tone" defaultValue={settings?.tone ?? "رسمی، قابل‌اعتماد و جذاب"} />
        </label>

        <label className="admin-switch">
          <input type="checkbox" name="generate_cover_image" defaultChecked={settings?.generate_cover_image} />
          <span className="admin-switch-track" />
          <span>تولید خودکار تصویر کاور با هوش مصنوعی</span>
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          پرامپت سفارشی اضافه (اختیاری)
          <textarea className="admin-input" name="custom_prompt" rows={3} defaultValue={settings?.custom_prompt ?? ""} />
        </label>

        <button type="submit" className="admin-btn admin-btn-primary" style={{ alignSelf: "flex-start", padding: "10px 22px" }}>ذخیره تنظیمات</button>
      </form>
    </div>
  );
}