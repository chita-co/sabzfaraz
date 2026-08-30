import { requirePartnerForPage } from "@/lib/partners/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPartnerSettings } from "@/lib/partners/settings";
import PartnerWithdrawalForm from "@/components/partner/PartnerWithdrawalForm";

const txLabel: Record<string, string> = {
  SALE_EARNING: "درآمد فروش", WITHDRAWAL: "برداشت", PENALTY: "جریمه", REFUND_DEDUCTION: "کسر بابت بازگشت وجه", MANUAL_ADJUSTMENT: "تنظیم دستی", SETTLEMENT: "تسویه",
};

export default async function PartnerWalletPage() {
  const partner = await requirePartnerForPage();
  const admin = createAdminClient();
  const settings = await getPartnerSettings();

  const { data: transactions } = await admin
    .from("partner_wallet_transactions")
    .select("*").eq("partner_id", partner.id).order("created_at", { ascending: false }).limit(50);

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>کیف پول من</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>
        <div className="partner-stat-card"><p style={{ fontSize: 12, color: "#6b7280" }}>قابل برداشت</p><p style={{ fontSize: 20, fontWeight: 800, color: "#16a34a" }}>{partner.wallet_available_balance.toLocaleString("fa-IR")} تومان</p></div>
        <div className="partner-stat-card"><p style={{ fontSize: 12, color: "#6b7280" }}>در انتظار تسویه</p><p style={{ fontSize: 20, fontWeight: 800, color: "#b45309" }}>{partner.wallet_pending_balance.toLocaleString("fa-IR")} تومان</p></div>
        <div className="partner-stat-card"><p style={{ fontSize: 12, color: "#6b7280" }}>ضمانت (غیرقابل برداشت)</p><p style={{ fontSize: 20, fontWeight: 800, color: "#6b7280" }}>{partner.reserve_balance.toLocaleString("fa-IR")} تومان</p></div>
      </div>

      <PartnerWithdrawalForm
        availableBalance={partner.wallet_available_balance - partner.reserve_balance}
        minWithdrawal={settings.min_withdrawal_amount}
        shebaNumber={partner.sheba_number ?? ""}
        cardNumber={partner.card_number ?? ""}
      />

      <div className="partner-card" style={{ marginTop: 20 }}>
        <h2 style={{ fontWeight: 700, marginBottom: 12 }}>تاریخچه تراکنش‌ها</h2>
        <table style={{ width: "100%", fontSize: 12.5, borderCollapse: "collapse" }}>
          <thead><tr style={{ textAlign: "right", color: "#6b7280" }}><th style={{ padding: 6 }}>تاریخ</th><th style={{ padding: 6 }}>شرح</th><th style={{ padding: 6 }}>مبلغ</th><th style={{ padding: 6 }}>وضعیت</th></tr></thead>
          <tbody>
            {(transactions ?? []).map((t) => (
              <tr key={t.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                <td style={{ padding: 6 }}>{new Date(t.created_at).toLocaleDateString("fa-IR")}</td>
                <td style={{ padding: 6 }}>{t.description || txLabel[t.type]}</td>
                <td style={{ padding: 6, color: t.amount >= 0 ? "#16a34a" : "#dc2626" }}>{t.amount.toLocaleString("fa-IR")} تومان</td>
                <td style={{ padding: 6 }}>{t.status === "PENDING" ? "در انتظار" : "نهایی"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}