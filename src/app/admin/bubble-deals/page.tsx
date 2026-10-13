import { createAdminClient } from "@/lib/supabase/admin";
import BubbleDealsAdmin, { type AdminProduct, type AdminCategory } from "@/components/admin/BubbleDealsAdmin";

export const dynamic = "force-dynamic";

export default async function AdminBubbleDealsPage() {
  const admin = createAdminClient();
  await admin.rpc("refresh_bubble_deals");

  const [productsRes, categoriesRes] = await Promise.all([
    admin
      .from("products")
      .select("id, name, images, price, discount_price, category_id, flash_price, flash_ends_at, flash_applied")
      .eq("is_active", true)
      .order("name"),
    admin.from("categories").select("id, name, parent_id").eq("is_active", true).order("name"),
  ]);

  if (productsRes.error) throw new Error(productsRes.error.message);
  if (categoriesRes.error) throw new Error(categoriesRes.error.message);

  return (
    <BubbleDealsAdmin
      products={(productsRes.data ?? []) as AdminProduct[]}
      categories={(categoriesRes.data ?? []) as AdminCategory[]}
    />
  );
}