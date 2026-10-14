import { createAdminClient } from "@/lib/supabase/admin";
import BubbleDealsAdmin, { type AdminProduct, type AdminCategory } from "@/components/admin/BubbleDealsAdmin";

export const dynamic = "force-dynamic";

const PAGE = 1000;

export default async function AdminBubbleDealsPage() {
  const admin = createAdminClient();
  await admin.rpc("refresh_bubble_deals");

  // Supabase در هر درخواست حداکثر ۱۰۰۰ ردیف می‌دهد؛ همه‌ی محصولات صفحه‌بندی می‌شوند
  const products: AdminProduct[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await admin
      .from("products")
      .select(
        "id, name, name_en, slug, images, price, discount_price, stock, flash_stock, category_id, is_active, flash_price, flash_ends_at, flash_applied"
      )
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);

    if (error) throw new Error(error.message);
    products.push(...((data ?? []) as AdminProduct[]));
    if (!data || data.length < PAGE) break;
  }

  const { data: cats, error: catErr } = await admin
    .from("categories")
    .select("id, name, parent_id")
    .order("name");
  if (catErr) throw new Error(catErr.message);

  return <BubbleDealsAdmin products={products} categories={(cats ?? []) as AdminCategory[]} />;
}