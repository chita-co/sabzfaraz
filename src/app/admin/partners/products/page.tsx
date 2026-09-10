import { createAdminClient } from "@/lib/supabase/admin";
import PendingPartnerProductsQueue from "@/components/admin/PendingPartnerProductsQueue";

export const dynamic = "force-dynamic";

export default async function AdminPartnerProductsQueuePage() {
  const admin = createAdminClient();
  const { data: products, error } = await admin
    .from("products")
    .select("id, name, description, price, partner_cost_price, stock, images, category:categories!products_category_id_fkey(name), partner:partners(business_name, phone), partner_approval_status, is_active")
    .not("partner_id", "is", null)
    .eq("partner_approval_status", "PENDING_REVIEW")
    .order("created_at", { ascending: true });

  if (error) console.error("خطا در دریافت صف بررسی محصولات همکاران:", error.message);

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>محصولات همکاران در انتظار بررسی</h1>
      <div className="admin-card">
        {(!products || products.length === 0) ? (
          <p className="text-gray-500 text-sm text-center py-6">محصولی در صف بررسی نیست.</p>
        ) : (
          <PendingPartnerProductsQueue products={products} />
        )}
      </div>
    </div>
  );
}