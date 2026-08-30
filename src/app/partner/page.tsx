import Link from "next/link";
import { requirePartnerForPage } from "@/lib/partners/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Package, ShoppingCart, Wallet, PlusCircle } from "lucide-react";

export default async function PartnerDashboardPage() {
  const partner = await requirePartnerForPage();
  const admin = createAdminClient();

  const [{ count: activeCount }, { count: pendingCount }, { count: newOrdersCount }, { data: recentItems }, { data: recentNotifs }] = await Promise.all([
    admin.from("products").select("id", { count: "exact", head: true }).eq("partner_id", partner.id).eq("partner_approval_status", "APPROVED"),
    admin.from("products").select("id", { count: "exact", head: true }).eq("partner_id", partner.id).eq("partner_approval_status", "PENDING_REVIEW"),
    admin.from("order_items").select("id", { count: "exact", head: true }).eq("partner_id", partner.id).eq("partner_fulfillment_status", "PENDING"),
    admin.from("order_items").select("id, product_name, quantity, order:orders(order_number)").eq("partner_id", partner.id).order("id", { ascending: false }).limit(5),
    admin.from("notifications").select("id, title, message").eq("user_id", partner.id).order("created_at", { ascending: false }).limit(5),
  ]);

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>سلام، {partner.business_name} 👋</h1>
      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>امتیاز شما: ⭐ {partner.rating_avg.toFixed(1)}</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
        <div className="partner-stat-card"><Package size={20} color="#16a34a" /><p style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>محصولات فعال</p><p style={{ fontSize: 20, fontWeight: 800 }}>{activeCount ?? 0}</p></div>
        <div className="partner-stat-card"><Package size={20} color="#b45309" /><p style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>در انتظار تأیید</p><p style={{ fontSize: 20, fontWeight: 800 }}>{pendingCount ?? 0}</p></div>
        <div className="partner-stat-card"><ShoppingCart size={20} color="#2563eb" /><p style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>سفارش‌های جدید</p><p style={{ fontSize: 20, fontWeight: 800 }}>{newOrdersCount ?? 0}</p></div>
        <div className="partner-stat-card"><Wallet size={20} color="#16a34a" /><p style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>موجودی کیف پول</p><p style={{ fontSize: 16, fontWeight: 800 }}>{(partner.wallet_available_balance + partner.wallet_pending_balance).toLocaleString("fa-IR")} تومان</p></div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        <Link href="/partner/products/new" className="partner-btn partner-btn-primary" style={{ display: "flex", alignItems: "center", gap: 6 }}><PlusCircle size={15} /> ثبت محصول جدید</Link>
        <Link href="/partner/products" className="partner-btn partner-btn-secondary">مدیریت محصولات</Link>
        <Link href="/partner/wallet" className="partner-btn partner-btn-secondary">درخواست برداشت</Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="partner-card">
          <h2 style={{ fontWeight: 700, marginBottom: 10, fontSize: 14 }}>آخرین سفارش‌ها</h2>
          {(recentItems ?? []).map((it: {
            id: string;
            product_name: string;
            quantity: number;
            order: { order_number: string } | { order_number: string }[] | null;
          }) => {
            const order = Array.isArray(it.order) ? it.order[0] : it.order;
            return (
              <div key={it.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f3f4f6", fontSize: 12.5 }}>
                <span>{it.product_name} × {it.quantity}</span><span dir="ltr">{order?.order_number}</span>
              </div>
            );
          })}
          {(!recentItems || recentItems.length === 0) && <p style={{ fontSize: 12, color: "#9ca3af" }}>هنوز سفارشی ثبت نشده.</p>}
        </div>
        <div className="partner-card">
          <h2 style={{ fontWeight: 700, marginBottom: 10, fontSize: 14 }}>اعلان‌های اخیر</h2>
          {(recentNotifs ?? []).map((n) => (
            <div key={n.id} style={{ padding: "6px 0", borderBottom: "1px solid #f3f4f6", fontSize: 12.5 }}>
              <p style={{ fontWeight: 700 }}>{n.title}</p><p style={{ color: "#6b7280" }}>{n.message}</p>
            </div>
          ))}
          {(!recentNotifs || recentNotifs.length === 0) && <p style={{ fontSize: 12, color: "#9ca3af" }}>اعلانی وجود ندارد.</p>}
        </div>
      </div>
    </div>
  );
}