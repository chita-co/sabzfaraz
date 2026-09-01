import { getCurrentPartner } from "@/lib/partners/auth";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import PartnerAuthForm from "@/components/partner/PartnerAuthForm";
import "../partner.css";

export const metadata = {
  title: "همکاری با سبزفراز | فروش محصولات الکترونیک",
  description: "همکار فروشنده شوید و محصولات خود را در فروشگاه اینترنتی سبزفراز بفروشید. بدون هزینه راه‌اندازی، با تسویه سریع و پشتیبانی اختصاصی.",
};

export default async function PartnerLoginPage() {
  const partner = await getCurrentPartner();
  if (partner?.status === "ACTIVE") redirect("/partner");


  const pendingMessage =
    partner?.status === "PENDING_REVIEW"
      ? "درخواست همکاری شما در حال بررسی است و پس از تأیید می‌توانید وارد شوید."
      : partner?.status === "REJECTED"
      ? "درخواست همکاری شما رد شده است."
      : partner?.status === "SUSPENDED"
      ? "حساب شما موقتاً تعلیق شده است."
      : partner?.status === "BLOCKED"
      ? "حساب شما مسدود شده است."
      : null;

  const admin = createAdminClient();
  const { data: categories } = await admin.from("categories").select("id, name").eq("partner_allowed", true).eq("is_active", true).order("name");
  const { data: settings } = await admin.from("partner_settings").select("partner_terms_text, registration_open").eq("id", 1).single();

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f3f4f6", padding: 20, direction: "rtl" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, width: "100%" }}>
        {pendingMessage && (
          <div style={{ maxWidth: 400, width: "100%", background: "#fef3c7", border: "1px solid #fde68a", color: "#b45309", borderRadius: 8, padding: "10px 14px", fontSize: 13, textAlign: "center" }}>
            {pendingMessage}
          </div>
        )}

        {/* بلوک توضیحات جذاب */}
        <div style={{ maxWidth: 420, width: "100%", textAlign: "center", background: "#fff", padding: "24px 20px", borderRadius: 14, boxShadow: "0 1px 3px rgba(0,0,0,.06)", marginBottom: 6 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 12 }}>
            فروش محصولاتت را با سبزفراز شروع کن
          </h1>
          <p style={{ fontSize: 13.5, lineHeight: 1.7, color: "#4b5563", marginBottom: 12 }}>
            اگر تولیدکننده یا واردکننده‌ی قطعات الکترونیک هستی، محصولاتت را در فروشگاه ما ثبت کن و
            بدون دغدغه‌ی بازاریابی، به هزاران مشتری علاقه‌مند بفروش.
          </p>
          <ul style={{ textAlign: "right", fontSize: 12.5, color: "#374151", listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 6 }}>
            <li>✔ بدون هزینه‌ی راه‌اندازی فروشگاه شخصی</li>
            <li>✔ پرداخت سریع و شفاف سهم شما</li>
            <li>✔ نمایش محصولات در معرض دید هزاران خریدار</li>
            <li>✔ پشتیبانی اختصاصی برای همکاران</li>
          </ul>
        </div>


        <PartnerAuthForm
          categories={categories ?? []}
          termsText={settings?.partner_terms_text ?? ""}
          registrationOpen={settings?.registration_open ?? true}
        />
      </div>
    </div>
  );
}