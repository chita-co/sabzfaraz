import Link from "next/link";
import { requirePartnerForPage } from "@/lib/partners/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import PartnerProductsTable from "@/components/partner/PartnerProductsTable";

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
      <PartnerProductsTable products={products ?? []} />
    </div>
  );
}