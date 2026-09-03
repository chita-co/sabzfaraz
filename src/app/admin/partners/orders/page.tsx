import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import PartnerOrdersManager from "@/components/admin/PartnerOrdersManager";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "در انتظار آماده‌سازی",
  PREPARING: "در حال آماده‌سازی",
  READY_FOR_PICKUP: "آماده تحویل به پیک",
  PICKED_UP: "تحویل گرفته شد از همکار",
  DELIVERED_TO_CUSTOMER: "تحویل به مشتری شد",
  STOCK_SHORTAGE: "عدم تامین توسط همکار",
  RETURNED_BY_CUSTOMER: "برگشت از مشتری",
  CANCELLED: "لغو‌شده",
};

interface PartnerOrderItem {
  id: string;
  product_name: string;
  quantity: number;
  price: number;
  partner_cost_price: number | null;
  partner_fulfillment_status: string;
  created_at: string;
  selected_color: string | null;
  selected_size: string | null;
  partner: { id: string; business_name: string; phone: string | null; partner_code: string | null }[] | null;
  order: { order_number: string; user_id: string; profile: { full_name: string } | null }[] | null;
}


export default async function AdminPartnerOrdersPage({
  searchParams,
}: { searchParams: Promise<{ status?: string; partnerId?: string; q?: string; from?: string; to?: string }> }) {
  const { status, partnerId, q, from, to } = await searchParams;
  const admin = createAdminClient();

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

  const [
    { count: todayCount }, { count: pendingCount }, { count: readyCount },
    { count: deliveredCount }, { count: shortageCount },
    { data: partnersForBalance }, { data: partners },
  ] = await Promise.all([
    admin.from("order_items").select("id", { count: "exact", head: true }).not("partner_id", "is", null).gte("created_at", todayStart.toISOString()),
    admin.from("order_items").select("id", { count: "exact", head: true }).eq("partner_fulfillment_status", "PENDING").not("partner_id", "is", null),
    admin.from("order_items").select("id", { count: "exact", head: true }).eq("partner_fulfillment_status", "READY_FOR_PICKUP"),
    admin.from("order_items").select("id", { count: "exact", head: true }).eq("partner_fulfillment_status", "DELIVERED_TO_CUSTOMER"),
    admin.from("order_items").select("id", { count: "exact", head: true }).eq("partner_fulfillment_status", "STOCK_SHORTAGE"),
    admin.from("partners").select("wallet_available_balance, wallet_pending_balance"),
    admin.from("partners").select("id, business_name, partner_code").order("business_name"),
  ]);

  const totalPayable = (partnersForBalance ?? []).reduce((s, p) => s + p.wallet_available_balance + p.wallet_pending_balance, 0);

  let query = admin
    .from("order_items")
    .select("id, product_name, quantity, price, partner_cost_price, partner_fulfillment_status, created_at, selected_color, selected_size, partner:partners(id, business_name, phone, partner_code), order:orders(order_number, user_id, profile:profiles(full_name))")
    .not("partner_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(200);

  if (status) query = query.eq("partner_fulfillment_status", status);
  if (partnerId) query = query.eq("partner_id", partnerId);
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to);

  const { data: items } = await query;

  const filteredItems = q
  ? (items as unknown as PartnerOrderItem[]).filter((it) => {
      const orderNumber = it.order?.[0]?.order_number;
      const partnerName = it.partner?.[0]?.business_name;
      return (
        it.product_name?.toLowerCase().includes(q.toLowerCase()) ||
        orderNumber?.toLowerCase().includes(q.toLowerCase()) ||
        partnerName?.toLowerCase().includes(q.toLowerCase())
      );
    })
  : (items ?? []);

  const managerItems = (filteredItems as PartnerOrderItem[]).map((it) => ({
    id: it.id,
    product_name: it.product_name,
    quantity: it.quantity,
    price: it.price,
    partner_cost_price: it.partner_cost_price,
    partner_fulfillment_status: it.partner_fulfillment_status,
    created_at: it.created_at,
    selected_color: it.selected_color,
    selected_size: it.selected_size,
    partner: it.partner?.[0]
      ? {
          id: it.partner[0].id,
          business_name: it.partner[0].business_name,
          phone: it.partner[0].phone ?? "",
          partner_code: it.partner[0].partner_code ?? "",
        }
      : null,
    order: it.order?.[0]
      ? {
          order_number: it.order[0].order_number,
          user_id: it.order[0].user_id,
          profile: it.order[0].profile ?? null,
        }
      : null,
  }));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800 }}>مدیریت سفارش‌های همکاران</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/admin/partners/orders/pickup-list" className="admin-btn admin-btn-primary">چاپ برگه تحویل پیک</Link>
          <Link href="/admin/partners/warehouse" className="admin-btn admin-btn-secondary">انبار همکاران</Link>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
        <div className="stat-card"><div><p className="stat-label">سفارش امروز</p><p className="stat-value">{todayCount ?? 0}</p></div></div>
        <div className="stat-card"><div><p className="stat-label">در انتظار آماده‌سازی</p><p className="stat-value" style={{ color: "#b45309" }}>{pendingCount ?? 0}</p></div></div>
        <div className="stat-card"><div><p className="stat-label">آماده تحویل به پیک</p><p className="stat-value" style={{ color: "#2563eb" }}>{readyCount ?? 0}</p></div></div>
        <div className="stat-card"><div><p className="stat-label">تحویل‌شده به مشتری</p><p className="stat-value" style={{ color: "#16a34a" }}>{deliveredCount ?? 0}</p></div></div>
        <div className="stat-card"><div><p className="stat-label">عدم تامین</p><p className="stat-value" style={{ color: "#dc2626" }}>{shortageCount ?? 0}</p></div></div>
        <div className="stat-card"><div><p className="stat-label">مجموع بدهی به همکاران</p><p className="stat-value">{totalPayable.toLocaleString("fa-IR")}</p></div></div>
      </div>

      <div className="admin-filters-bar">
        {["", "PENDING", "PREPARING", "READY_FOR_PICKUP", "PICKED_UP", "DELIVERED_TO_CUSTOMER", "STOCK_SHORTAGE", "RETURNED_BY_CUSTOMER"].map((s) => (
          <Link key={s || "all"} href={s ? `/admin/partners/orders?status=${s}` : "/admin/partners/orders"} className={`order-tab${(status ?? "") === s ? " active" : ""}`}>
            {s ? STATUS_LABELS[s] : "همه"}
          </Link>
        ))}
      </div>

      <PartnerOrdersManager items={managerItems} partners={partners ?? []} statusLabels={STATUS_LABELS} />

    </div>
  );
}