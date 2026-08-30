import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { suspendPartnerAction, activatePartnerAction, applyPenaltyAction, overrideRatingAction } from "../actions";
import { recordSettlementAction } from "./actions";

export default async function AdminPartnerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminClient();

  const [{ data: partner }, { data: settlements }, { data: penalties }, { data: productCount }] = await Promise.all([
    admin.from("partners").select("*").eq("id", id).single(),
    admin.from("partner_settlements").select("*").eq("partner_id", id).order("created_at", { ascending: false }).limit(10),
    admin.from("partner_penalties").select("*").eq("partner_id", id).order("created_at", { ascending: false }).limit(10),
    admin.from("products").select("id", { count: "exact", head: true }).eq("partner_id", id).eq("partner_approval_status", "APPROVED"),
  ]);
  if (!partner) notFound();

  const withdrawable = partner.wallet_available_balance - partner.reserve_balance;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="admin-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800 }}>{partner.business_name}</h1>
            <p style={{ fontSize: 13, color: "#6b7280" }} dir="ltr">{partner.phone}</p>
            <p style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>وضعیت: <b>{partner.status}</b> — امتیاز: ⭐ {partner.rating_avg} — تعداد تخلف کمبود موجودی: {partner.stock_out_violation_count}</p>
            <p style={{ fontSize: 12, color: "#6b7280" }}>محصولات منتشرشده: {productCount?.length ?? 0}</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {partner.status === "ACTIVE" ? (
              <form action={async () => { "use server"; await suspendPartnerAction(id); }}>
                <button className="admin-btn admin-btn-danger">تعلیق همکار</button>
              </form>
            ) : (
              <form action={async () => { "use server"; await activatePartnerAction(id); }}>
                <button className="admin-btn admin-btn-primary">فعال‌سازی مجدد</button>
              </form>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <div className="stat-card"><div><p className="stat-label">قابل برداشت</p><p className="stat-value">{partner.wallet_available_balance.toLocaleString("fa-IR")}</p></div></div>
        <div className="stat-card"><div><p className="stat-label">در انتظار</p><p className="stat-value">{partner.wallet_pending_balance.toLocaleString("fa-IR")}</p></div></div>
        <div className="stat-card"><div><p className="stat-label">ضمانت</p><p className="stat-value">{partner.reserve_balance.toLocaleString("fa-IR")}</p></div></div>
      </div>

      {/* تسویه حساب */}
      <div className="admin-card" style={{ maxWidth: 480 }}>
        <h2 style={{ fontWeight: 800, marginBottom: 12 }}>تسویه حساب</h2>
        <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 10 }}>حداکثر مبلغ قابل تسویه: {withdrawable.toLocaleString("fa-IR")} تومان</p>
       <form action={async (formData) => { "use server"; await recordSettlementAction(id, Number(formData.get("amount")), formData.get("method") as "CARD_TO_CARD" | "SHEBA" | "POS", String(formData.get("ref"))); }} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input className="admin-input" name="amount" type="number" placeholder="مبلغ تسویه (تومان)" required />
          <select className="admin-input" name="method">
            <option value="CARD_TO_CARD">کارت به کارت</option>
            <option value="SHEBA">شبا</option>
            <option value="POS">کارتخوان</option>
          </select>
          <input className="admin-input" name="ref" placeholder="شماره پیگیری / شماره فیش" required />
          <button className="admin-btn admin-btn-primary" style={{ alignSelf: "flex-start" }}>ثبت تسویه</button>
        </form>
        <div style={{ marginTop: 14 }}>
          {(settlements ?? []).map((s) => (
            <div key={s.id} style={{ fontSize: 12, padding: "6px 0", borderBottom: "1px solid #f3f4f6" }}>
              {new Date(s.created_at).toLocaleDateString("fa-IR")} — {s.amount.toLocaleString("fa-IR")} تومان — {s.method} — پیگیری: {s.reference_number}
            </div>
          ))}
        </div>
      </div>

      {/* جریمه */}
      <div className="admin-card" style={{ maxWidth: 480 }}>
        <h2 style={{ fontWeight: 800, marginBottom: 12 }}>ثبت جریمه</h2>
        <form action={async (formData) => { "use server"; await applyPenaltyAction(id, Number(formData.get("amount")), String(formData.get("reason"))); }} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input className="admin-input" name="amount" type="number" placeholder="مبلغ جریمه (تومان)" required />
          <select className="admin-input" name="reason">
            <option value="عدم موجودی">عدم موجودی</option>
            <option value="تأخیر در آماده‌سازی">تأخیر در آماده‌سازی</option>
            <option value="مغایرت کالا با توضیحات">مغایرت کالا با توضیحات</option>
            <option value="بازگشت وجه به مشتری">بازگشت وجه به مشتری</option>
          </select>
          <button className="admin-btn admin-btn-danger" style={{ alignSelf: "flex-start" }}>ثبت جریمه</button>
        </form>
        <div style={{ marginTop: 14 }}>
          {(penalties ?? []).map((p) => (
            <div key={p.id} style={{ fontSize: 12, padding: "6px 0", borderBottom: "1px solid #f3f4f6" }}>
              {new Date(p.created_at).toLocaleDateString("fa-IR")} — {p.amount.toLocaleString("fa-IR")} تومان — {p.reason}
            </div>
          ))}
        </div>
      </div>

      {/* اورراید دستی امتیاز */}
      <div className="admin-card" style={{ maxWidth: 340 }}>
        <h2 style={{ fontWeight: 800, marginBottom: 12 }}>تنظیم دستی امتیاز</h2>
        <form action={async (formData) => { "use server"; await overrideRatingAction(id, Number(formData.get("rating"))); }} style={{ display: "flex", gap: 8 }}>
          <input className="admin-input" name="rating" type="number" step="0.1" min="1" max="5" defaultValue={partner.rating_avg} />
          <button className="admin-btn admin-btn-primary">ثبت</button>
        </form>
      </div>
    </div>
  );
}