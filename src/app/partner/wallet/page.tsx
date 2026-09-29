import { requirePartnerForPage } from "@/lib/partners/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPartnerSettings } from "@/lib/partners/settings";
import PartnerWithdrawalForm from "@/components/partner/PartnerWithdrawalForm";
import { releaseMaturedPartnerBalances } from "@/lib/partners/wallet";

const txLabel: Record<string, string> = {
  SALE_EARNING: "درآمد فروش", WITHDRAWAL: "برداشت", PENALTY: "جریمه", REFUND_DEDUCTION: "کسر بابت بازگشت وجه", MANUAL_ADJUSTMENT: "تنظیم دستی", SETTLEMENT: "تسویه",
};

const fulfillLabel: Record<string, string> = {
  PENDING: "در انتظار",
  PREPARING: "در حال آماده‌سازی",
  READY_FOR_PICKUP: "آماده تحویل به پیک",
  PICKED_UP: "تحویل به پیک",
  DELIVERED_TO_CUSTOMER: "تحویل به مشتری شد",
  STOCK_SHORTAGE: "عدم تامین",
  RETURNED_BY_CUSTOMER: "برگشت از مشتری",
  CANCELLED: "لغو‌شده",
};

export default async function PartnerWalletPage() {
  const partner = await requirePartnerForPage();
  const admin = createAdminClient();
  const settings = await getPartnerSettings();
  await releaseMaturedPartnerBalances(partner.id);
  const { data: freshBalances } = await admin
    .from("partners")
    .select("wallet_pending_balance, wallet_available_balance, reserve_balance")
    .eq("id", partner.id)
    .single();
  if (freshBalances) Object.assign(partner, freshBalances);

  const { data: transactions } = await admin
    .from("partner_wallet_transactions")
    .select("*").eq("partner_id", partner.id).order("created_at", { ascending: false }).limit(50);

  const itemIds = [...new Set((transactions ?? []).map((t) => t.order_item_id).filter(Boolean))] as string[];
  const itemStatusMap = new Map<string, string>();
  if (itemIds.length > 0) {
    const { data: itemRows } = await admin
      .from("order_items")
      .select("id, partner_fulfillment_status")
      .in("id", itemIds);
    (itemRows ?? []).forEach((r: { id: string; partner_fulfillment_status: string }) => 
      itemStatusMap.set(r.id, r.partner_fulfillment_status)
    );
  }

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
                <td
  style={{
    padding: 6,
    color:
      t.status === "REJECTED"
        ? "#dc2626"
        : t.type === "SALE_EARNING"
        ? "#2563eb"
        : t.type === "WITHDRAWAL"
        ? "#16a34a"
        : t.amount >= 0
        ? "#16a34a"
        : "#dc2626",
  }}
>
  {t.status === "REJECTED" ? (
    <>
      {Math.abs(t.amount).toLocaleString("fa-IR")} تومان
      <span style={{ fontSize: 11, display: "block", color: "#9ca3af" }}>درخواست رد شد</span>
    </>
  ) : (
    `${t.amount.toLocaleString("fa-IR")} تومان`
  )}
</td>
                <td style={{ padding: 6 }}>
  {t.type === "SALE_EARNING" && t.order_item_id && itemStatusMap.get(t.order_item_id) ? (
    <>
      <div>{fulfillLabel[itemStatusMap.get(t.order_item_id) as string] ?? "—"}</div>
      <div style={{ fontSize: 11, color: t.status === "PENDING" ? "#b45309" : "#16a34a" }}>
        {t.status === "PENDING"
          ? `در انتظار تسویه${t.available_at ? ` تا ${new Date(t.available_at).toLocaleDateString("fa-IR", { timeZone: "Asia/Tehran" })}` : ""}`
          : "قابل برداشت شد"}
      </div>
    </>
  ) : t.status === "PENDING" ? (
    "در انتظار"
  ) : t.status === "REJECTED" ? (
    <span style={{ color: "#b91c1c" }}>رد شده</span>
  ) : (
    "نهایی"
  )}
</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}