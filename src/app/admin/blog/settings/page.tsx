import { createAdminClient } from "@/lib/supabase/admin";
import { updateBlogBotSettingsAction } from "../actions";

export default async function AdminBlogSettingsPage() {
  const admin = createAdminClient();
  const { data: settings } = await admin.from("blog_bot_settings").select("*").eq("id", 1).single();

  return (
    <div className="admin-card" style={{ maxWidth: 640 }}>
      <h1 style={{ fontSize: 18, fontWeight: 800, marginBottom: 18 }}>تنظیمات ربات تولید محتوا</h1>
      {settings?.is_running ? (
        <div className="blog-bot-status running">🟢 ربات همین الان در حال نوشتن مقاله است (شروع: {new Date(settings.last_run_started_at).toLocaleTimeString("fa-IR")})</div>
      ) : settings?.rate_limited_until && new Date(settings.rate_limited_until) > new Date() ? (
        <div className="blog-bot-status limited">🟠 سهمیه‌ی رایگان تمام شده — تا {new Date(settings.rate_limited_until).toLocaleString("fa-IR")} صبر می‌کند</div>
      ) : (
        <div className="blog-bot-status idle">⚪ ربات آماده و منتظر اجراست</div>
      )}
      {settings?.last_run_summary && <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 14 }}>آخرین اجرا: {settings.last_run_summary}</p>}
      <form
        action={async (formData) => {
          "use server";
          await updateBlogBotSettingsAction(formData);
        }}
        style={{ display: "flex", flexDirection: "column", gap: 16 }}
      >
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