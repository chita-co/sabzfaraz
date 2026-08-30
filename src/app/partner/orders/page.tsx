import { requirePartnerForPage } from "@/lib/partners/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import PartnerOrderStatusControl from "@/components/partner/PartnerOrderStatusControl";

export default async function PartnerOrdersPage() {
  const partner = await requirePartnerForPage();
  const admin = createAdminClient();

  const { data: items } = await admin
    .from("order_items")
    .select("id, product_name, quantity, partner_cost_price, partner_fulfillment_status, order:orders(order_number, created_at)")
    .eq("partner_id", partner.id)
    .order("id", { ascending: false });

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>سفارش‌های من</h1>
      <div className="partner-card">
        <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
          <thead><tr style={{ textAlign: "right", color: "#6b7280", borderBottom: "2px solid #f3f4f6" }}>
            <th style={{ padding: 8 }}>شماره فاکتور</th><th style={{ padding: 8 }}>محصول</th><th style={{ padding: 8 }}>تعداد</th><th style={{ padding: 8 }}>مبلغ دریافتی</th><th style={{ padding: 8 }}>وضعیت</th>
          </tr></thead>
          <tbody>
            {(items ?? []).map((it: {
              id: string;
              product_name: string;
              quantity: number;
              partner_cost_price: number | null;
              partner_fulfillment_status: string;
              order: { order_number: string; created_at: string } | { order_number: string; created_at: string }[] | null;
            }) => {
              const order = Array.isArray(it.order) ? it.order[0] : it.order;
              return (
                <tr key={it.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: 8 }} dir="ltr">{order?.order_number}</td>
                  <td style={{ padding: 8 }}>{it.product_name}</td>
                  <td style={{ padding: 8 }}>{it.quantity.toLocaleString("fa-IR")}</td>
                  <td style={{ padding: 8 }}>{((it.partner_cost_price ?? 0) * it.quantity).toLocaleString("fa-IR")} تومان</td>
                  <td style={{ padding: 8 }}><PartnerOrderStatusControl itemId={it.id} currentStatus={it.partner_fulfillment_status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {(!items || items.length === 0) && <p style={{ textAlign: "center", color: "#9ca3af", padding: 20 }}>هنوز سفارشی ثبت نشده.</p>}
      </div>
    </div>
  );
}