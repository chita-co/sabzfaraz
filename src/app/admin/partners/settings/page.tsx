import { createAdminClient } from "@/lib/supabase/admin";
import { updatePartnerSettingsAction, uploadFrameTemplateAction, addAiKeyAction, deleteAiKeyAction } from "./actions";
import RegenerateImagesButton from "@/components/admin/RegenerateImagesButton";
import { uploadWatermarkAction } from "./actions";

export default async function AdminPartnerSettingsPage() {
  const admin = createAdminClient();
  const { data: settings } = await admin.from("partner_settings").select("*").eq("id", 1).single();
  const { data: aiKeys } = await admin.from("partner_ai_keys").select("*").order("priority");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="admin-card" style={{ maxWidth: 640 }}>
        <h2 style={{ fontWeight: 800, marginBottom: 14 }}>تنظیمات کلی همکاران</h2>
        <form action={updatePartnerSettingsAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label className="admin-form-group"><span>حداقل درصد سود سایت (٪)</span><input className="admin-input" name="min_profit_percent" type="number" step="0.1" defaultValue={settings?.min_profit_percent} /></label>
          <label className="admin-form-group"><span>دوره تسویه (روز تا قابل‌برداشت‌شدن)</span><input className="admin-input" name="settlement_hold_days" type="number" defaultValue={settings?.settlement_hold_days} /></label>
          <label className="admin-form-group"><span>مبلغ ذخیره تضمین (تومان)</span><input className="admin-input" name="reserve_balance_amount" type="number" defaultValue={settings?.reserve_balance_amount} /></label>
          <label className="admin-form-group"><span>حداقل مبلغ برداشت (تومان)</span><input className="admin-input" name="min_withdrawal_amount" type="number" defaultValue={settings?.min_withdrawal_amount} /></label>
          <label className="admin-form-group"><span>حداکثر تعداد تخلف مجاز قبل از تعلیق خودکار</span><input className="admin-input" name="auto_suspend_after_violations" type="number" defaultValue={settings?.auto_suspend_after_violations} /></label>
          <label className="admin-switch"><input type="checkbox" name="auto_rating_enabled" defaultChecked={settings?.auto_rating_enabled} /><span className="admin-switch-track" /><span>امتیازدهی خودکار فعال باشد</span></label>
          <label className="admin-switch"><input type="checkbox" name="registration_open" defaultChecked={settings?.registration_open} /><span className="admin-switch-track" /><span>ثبت‌نام همکار جدید باز باشد</span></label>
          <label className="admin-form-group"><span>پرامپت پیش‌فرض هوش مصنوعی</span><textarea className="admin-input" name="ai_default_prompt" rows={3} defaultValue={settings?.ai_default_prompt} /></label>
          <label className="admin-form-group"><span>ترتیب استفاده از کلیدهای AI</span>
            <select className="admin-input" name="ai_rotation_mode" defaultValue={settings?.ai_rotation_mode}>
              <option value="SEQUENTIAL">ترتیبی</option>
              <option value="RANDOM">تصادفی</option>
            </select>
          </label>
          <label className="admin-form-group"><span>متن قوانین همکاری</span><textarea className="admin-input" name="partner_terms_text" rows={4} defaultValue={settings?.partner_terms_text} /></label>
          <button className="admin-btn admin-btn-primary" style={{ alignSelf: "flex-start" }}>ذخیره تنظیمات</button>
        </form>
      </div>

      <div className="admin-card" style={{ maxWidth: 640 }}>
        <h2 style={{ fontWeight: 800, marginBottom: 6 }}>قالب اختصاصی تصویر محصول</h2>
        <p style={{ fontSize: 11.5, color: "#dc2626", marginBottom: 12 }}>⚠️ فایل باید PNG با ناحیه‌ی مرکزی کاملاً شفاف (Transparent) باشد — نه سفید — تا عکس محصول همکار از داخلش دیده شود.</p>
        <form action={uploadFrameTemplateAction} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
          {settings?.frame_template_url && <img src={settings.frame_template_url} alt="قالب فعلی" style={{ width: 140, borderRadius: 8, border: "1px solid #e5e7eb" }} />}
          <input type="file" name="file" accept="image/png" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <label className="admin-form-group"><span>X مرکز (٪)</span><input className="admin-input" name="frame_center_x" type="number" step="0.1" defaultValue={settings?.frame_center_x} /></label>
            <label className="admin-form-group"><span>Y مرکز (٪)</span><input className="admin-input" name="frame_center_y" type="number" step="0.1" defaultValue={settings?.frame_center_y} /></label>
            <label className="admin-form-group"><span>عرض ناحیه مرکزی (٪)</span><input className="admin-input" name="frame_center_width" type="number" step="0.1" defaultValue={settings?.frame_center_width} /></label>
            <label className="admin-form-group"><span>ارتفاع ناحیه مرکزی (٪)</span><input className="admin-input" name="frame_center_height" type="number" step="0.1" defaultValue={settings?.frame_center_height} /></label>
          </div>
          <button className="admin-btn admin-btn-primary" style={{ alignSelf: "flex-start" }}>ذخیره قالب</button>
        </form>
        <RegenerateImagesButton />
      </div>

      <div className="admin-card" style={{ maxWidth: 640 }}>
        <h2 style={{ fontWeight: 800, marginBottom: 6 }}>واترمارک تصاویر محصولات همکاران</h2>
        <p style={{ fontSize: 11.5, color: "#6b7280", marginBottom: 12 }}>یک تصویر PNG با پس‌زمینه‌ی شفاف (مثلاً نوشته‌ی «sabzfaraz.ir») آپلود کنید. این نشان روی تمام تصاویر محصولات همکاران، وسط تصویر، مورب و محو قرار می‌گیرد.</p>
        <form action={uploadWatermarkAction} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {settings?.watermark_url && <img src={settings.watermark_url} alt="واترمارک فعلی" style={{ width: 140, borderRadius: 8, border: "1px solid #e5e7eb", background: "#111827", padding: 8 }} />}
          <input type="file" name="file" accept="image/png" />
          <label className="admin-switch">
            <input type="checkbox" name="watermark_enabled" defaultChecked={settings?.watermark_enabled} />
            <span className="admin-switch-track" />
            <span>واترمارک روی تصاویر همکاران فعال باشد</span>
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <label className="admin-form-group"><span>شفافیت (۰ تا ۱)</span><input className="admin-input" name="watermark_opacity" type="number" step="0.05" min="0" max="1" defaultValue={settings?.watermark_opacity ?? 0.35} /></label>
            <label className="admin-form-group"><span>زاویه چرخش (درجه)</span><input className="admin-input" name="watermark_rotation" type="number" defaultValue={settings?.watermark_rotation ?? -30} /></label>
            <label className="admin-form-group"><span>اندازه نسبت به عکس (٪)</span><input className="admin-input" name="watermark_scale_percent" type="number" defaultValue={settings?.watermark_scale_percent ?? 45} /></label>
          </div>
          <button className="admin-btn admin-btn-primary" style={{ alignSelf: "flex-start" }}>ذخیره واترمارک</button>
        </form>
      </div>

      <div className="admin-card" style={{ maxWidth: 640 }}>
        <h2 style={{ fontWeight: 800, marginBottom: 12 }}>کلیدهای API هوش مصنوعی</h2>
        {(aiKeys ?? []).map((k) => (
          <div key={k.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
            <span style={{ fontSize: 13 }}>{k.label} (اولویت {k.priority}) — امروز {k.daily_used_count} درخواست</span>
            <form action={async () => { "use server"; await deleteAiKeyAction(k.id); }}>
              <button className="admin-btn admin-btn-danger" style={{ padding: "4px 10px", fontSize: 11 }}>حذف</button>
            </form>
          </div>
        ))}
        <form action={addAiKeyAction} style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <input className="admin-input" name="label" placeholder="نام (مثلاً Gemini حساب ۱)" style={{ flex: 1 }} />
          <input className="admin-input" name="api_key" placeholder="کلید API" style={{ flex: 2 }} dir="ltr" />
          <input className="admin-input" name="priority" type="number" placeholder="اولویت" style={{ width: 80 }} />
          <button className="admin-btn admin-btn-primary">افزودن</button>
        </form>
      </div>
    </div>
  );
}