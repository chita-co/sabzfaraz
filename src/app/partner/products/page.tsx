import Link from "next/link";
import { requirePartnerForPage } from "@/lib/partners/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import PartnerProductsView from "@/components/partner/PartnerProductsView";

export default async function PartnerProductsPage() {
  const partner = await requirePartnerForPage();
  const admin = createAdminClient();
  const [{ data: products }, { data: categories }] = await Promise.all([
    admin
      .from("products")
      .select("id, name, price, partner_cost_price, stock, partner_stock_unlimited, partner_approval_status, partner_rejection_reason, is_active, created_at, images, category_id")
      .eq("partner_id", partner.id)
      .order("created_at", { ascending: false }),
    admin.from("categories").select("id, name, parent_id"),
  ]);

  return (
    <PartnerProductsView
      products={products ?? []}
      categories={categories ?? []}
      actions={
        <>
          <Link href="/partner/products/new" className="partner-btn partner-btn-primary">+ افزودن محصول جدید</Link>
          <Link href="/partner/products/bulk-upload" className="partner-btn partner-btn-secondary">افزودن گروهی با اکسل</Link>
          <Link href="/partner/products/bulk-price-update" className="partner-btn partner-btn-secondary">تغییر قیمت گروهی</Link>
        </>
      }
    />
  );
}