import Link from "next/link";
import PartnerProductDeleteButton from "@/components/partner/PartnerProductDeleteButton";
import { requirePartnerForPage } from "@/lib/partners/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const statusLabel: Record<string, string> = {
  PENDING_REVIEW: "در انتظار بررسی", APPROVED: "منتشرشده", REJECTED: "رد شده", SUSPENDED: "تعلیق‌شده",
};

export default async function PartnerProductsPage() {
  const partner = await requirePartnerForPage();
  const admin = createAdminClient();
  const { data: products } = await admin
    .from("products")
    .select("id, name, price, stock, partner_stock_unlimited, partner_approval_status, partner_rejection_reason, is_active, created_at")
    .eq("partner_id", partner.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800 }}>محصولات من</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/partner/products/new" className="partner-btn partner-btn-primary">+ افزودن محصول جدید</Link>
          <Link href="/partner/products/bulk-upload" className="partner-btn partner-btn-secondary">افزودن گروهی با اکسل</Link>
          <Link href="/partner/products/bulk-price-update" className="partner-btn partner-btn-secondary">تغییر قیمت گروهی</Link>
        </div>
      </div>
      <div className="partner-card">
        <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "right", color: "#6b7280", borderBottom: "2px solid #f3f4f6" }}>
              <th style={{ padding: 8 }}>نام</th><th style={{ padding: 8 }}>قیمت فروش</th><th style={{ padding: 8 }}>موجودی</th><th style={{ padding: 8 }}>وضعیت</th><th></th>
            </tr>
          </thead>
          <tbody>
            {(products ?? []).map((p) => (
              <tr key={p.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: 8 }}>{p.name}</td>
                <td style={{ padding: 8 }}>{p.price.toLocaleString("fa-IR")} تومان</td>
                <td style={{ padding: 8 }}>{p.partner_stock_unlimited ? "نامحدود" : p.stock.toLocaleString("fa-IR")}</td>
                <td style={{ padding: 8 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: p.partner_approval_status === "APPROVED" ? "#16a34a" : p.partner_approval_status === "REJECTED" ? "#dc2626" : "#b45309" }}>
                    {statusLabel[p.partner_approval_status] ?? p.partner_approval_status}
                  </span>
                  {p.partner_rejection_reason && <p style={{ fontSize: 10.5, color: "#dc2626" }}>{p.partner_rejection_reason}</p>}
                </td>
                <td style={{ padding: 8, display: "flex", gap: 6 }}>
  <Link href={`/partner/products/${p.id}/edit`} className="partner-btn partner-btn-secondary" style={{ padding: "4px 12px", fontSize: 12 }}>ویرایش</Link>
  <PartnerProductDeleteButton productId={p.id} />
</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!products || products.length === 0) && <p style={{ color: "#9ca3af", fontSize: 13, textAlign: "center", padding: 20 }}>هنوز محصولی ثبت نکرده‌اید.</p>}
      </div>
    </div>
  );
}