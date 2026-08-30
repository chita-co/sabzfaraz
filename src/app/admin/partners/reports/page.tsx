import { createAdminClient } from "@/lib/supabase/admin";
import ExportPartnerReportButton from "@/components/admin/ExportPartnerReportButton";

export default async function AdminPartnerReportsPage() {
  const admin = createAdminClient();

  const { data: partners } = await admin.from("partners").select("id, business_name, status, rating_avg");
  const { data: orderItems } = await admin.from("order_items").select("partner_id, price, partner_cost_price, quantity, partner_fulfillment_status").not("partner_id", "is", null);
  const { data: penalties } = await admin.from("partner_penalties").select("partner_id, amount");
  const { data: settlements } = await admin.from("partner_settlements").select("partner_id, amount");

  const rows = (partners ?? []).map((p) => {
    const items = (orderItems ?? []).filter((i) => i.partner_id === p.id && i.partner_fulfillment_status !== "CANCELLED");
    const totalSales = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const totalCost = items.reduce((s, i) => s + (i.partner_cost_price ?? 0) * i.quantity, 0);
    const siteProfit = totalSales - totalCost;
    const totalPenalty = (penalties ?? []).filter((x) => x.partner_id === p.id).reduce((s, x) => s + x.amount, 0);
    const totalSettled = (settlements ?? []).filter((x) => x.partner_id === p.id).reduce((s, x) => s + x.amount, 0);
    return { name: p.business_name, status: p.status, rating: p.rating_avg, totalSales, siteProfit, totalPenalty, totalSettled };
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800 }}>گزارش مالی همکاران</h1>
        <ExportPartnerReportButton rows={rows} />
      </div>
      <div className="admin-card">
        <table className="admin-table">
          <thead><tr><th>همکار</th><th>وضعیت</th><th>امتیاز</th><th>فروش کل</th><th>سود سایت</th><th>مجموع جریمه</th><th>مجموع تسویه</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{r.name}</td><td>{r.status}</td><td>{r.rating}</td>
                <td>{r.totalSales.toLocaleString("fa-IR")}</td>
                <td>{r.siteProfit.toLocaleString("fa-IR")}</td>
                <td>{r.totalPenalty.toLocaleString("fa-IR")}</td>
                <td>{r.totalSettled.toLocaleString("fa-IR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}