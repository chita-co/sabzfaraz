import { requirePartnerForPage } from "@/lib/partners/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPaidOrderIdSet } from "@/lib/partners/orderIntegration";
import PartnerOrderStatusControl from "@/components/partner/PartnerOrderStatusControl";

export default async function PartnerOrdersPage() {
  const partner = await requirePartnerForPage();
  const admin = createAdminClient();

  const { data: allItems } = await admin
    .from("order_items")
    .select("id, order_id, product_name, quantity, partner_cost_price, partner_fulfillment_status, order:orders(order_number, created_at)")
    .eq("partner_id", partner.id)
    .order("id", { ascending: false });

  const orderIds = [...new Set((allItems ?? []).map((i) => i.order_id))];
  const paidOrderIds = await getPaidOrderIdSet(admin, orderIds);
  const items = (allItems ?? []).filter((i) => paidOrderIds.has(i.order_id));

  type OrderInfo = { order_number: string; created_at: string };
  type ItemRow = {
    id: string; order_id: string; product_name: string; quantity: number;
    partner_cost_price: number | null; partner_fulfillment_status: string;
    order: OrderInfo | OrderInfo[] | null;
  };

  const groups = new Map<string, { orderNumber: string; createdAt: number; items: ItemRow[] }>();
  for (const it of items as ItemRow[]) {
    const order = Array.isArray(it.order) ? it.order[0] : it.order;
    const g = groups.get(it.order_id) ?? {
      orderNumber: order?.order_number ?? "",
      createdAt: order?.created_at ? new Date(order.created_at).getTime() : 0,
      items: [],
    };
    g.items.push(it);
    groups.set(it.order_id, g);
  }
  const sortedGroups = [...groups.entries()].sort((a, b) => b[1].createdAt - a[1].createdAt);

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>سفارش‌های من</h1>

      {sortedGroups.map(([orderId, g]) => {
        const total = g.items.reduce((s, it) => s + (it.partner_cost_price ?? 0) * it.quantity, 0);
        return (
          <div key={orderId} className="partner-card" style={{ border: "1.5px solid #d1d5db", marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, paddingBottom: 8, marginBottom: 6, borderBottom: "2px solid #f3f4f6", fontSize: 13 }}>
              <span>شماره فاکتور: <b dir="ltr">{g.orderNumber}</b></span>
              <span style={{ color: "#6b7280" }}>
                {g.createdAt
                  ? `${new Date(g.createdAt).toLocaleDateString("fa-IR", { timeZone: "Asia/Tehran" })} — ${new Date(g.createdAt).toLocaleTimeString("fa-IR", { timeZone: "Asia/Tehran", hour: "2-digit", minute: "2-digit" })}`
                  : "—"}
              </span>
              <span>جمع دریافتی: <b>{total.toLocaleString("fa-IR")} تومان</b></span>
            </div>
            <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
              <thead><tr style={{ textAlign: "right", color: "#6b7280" }}>
                <th style={{ padding: 8 }}>محصول</th><th style={{ padding: 8 }}>تعداد</th><th style={{ padding: 8 }}>مبلغ دریافتی</th><th style={{ padding: 8 }}>وضعیت</th>
              </tr></thead>
              <tbody>
                {g.items.map((it) => (
                  <tr key={it.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                    <td style={{ padding: 8 }}>{it.product_name}</td>
                    <td style={{ padding: 8 }}>{it.quantity.toLocaleString("fa-IR")}</td>
                    <td style={{ padding: 8 }}>{((it.partner_cost_price ?? 0) * it.quantity).toLocaleString("fa-IR")} تومان</td>
                    <td style={{ padding: 8 }}><PartnerOrderStatusControl itemId={it.id} currentStatus={it.partner_fulfillment_status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      {sortedGroups.length === 0 && (
        <div className="partner-card"><p style={{ textAlign: "center", color: "#9ca3af", padding: 20 }}>هنوز سفارشی ثبت نشده.</p></div>
      )}
    </div>
  );
}