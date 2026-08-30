import { requirePartnerForPage } from "@/lib/partners/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString();

export default async function PartnerRatingPage() {
  const partner = await requirePartnerForPage();
  const admin = createAdminClient();

  const [{ count: successCount }, { count: cancelCount }, { count: penaltyCount }] = await Promise.all([
    admin.from("order_items").select("id", { count: "exact", head: true }).eq("partner_id", partner.id).neq("partner_fulfillment_status", "CANCELLED"),
    admin.from("order_items").select("id", { count: "exact", head: true }).eq("partner_id", partner.id).eq("partner_fulfillment_status", "CANCELLED"),
    admin.from("partner_penalties").select("id", { count: "exact", head: true }).eq("partner_id", partner.id).gte("created_at", ninetyDaysAgo),
  ]);

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>امتیاز و اعتبار من</h1>
      <div className="partner-card" style={{ maxWidth: 420, textAlign: "center", marginBottom: 20 }}>
        <p style={{ fontSize: 36, fontWeight: 800, color: "#f59e0b" }}>⭐ {partner.rating_avg.toFixed(1)}</p>
        <p style={{ fontSize: 12, color: "#6b7280" }}>از ۵ ستاره</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: 12 }}>
        <div className="partner-stat-card"><p style={{ fontSize: 12, color: "#6b7280" }}>سفارش‌های موفق</p><p style={{ fontSize: 18, fontWeight: 800 }}>{successCount ?? 0}</p></div>
        <div className="partner-stat-card"><p style={{ fontSize: 12, color: "#6b7280" }}>لغوشده (کمبود موجودی)</p><p style={{ fontSize: 18, fontWeight: 800, color: "#dc2626" }}>{cancelCount ?? 0}</p></div>
        <div className="partner-stat-card"><p style={{ fontSize: 12, color: "#6b7280" }}>تخلفات ۹۰ روز اخیر</p><p style={{ fontSize: 18, fontWeight: 800, color: "#b45309" }}>{penaltyCount ?? 0}</p></div>
      </div>
      <p style={{ fontSize: 11.5, color: "#9ca3af", marginTop: 16 }}>امتیاز شما بر اساس نرخ لغو سفارش، تعداد تخلفات و سرعت آماده‌سازی به‌صورت خودکار محاسبه می‌شود.</p>
    </div>
  );
}