import { createClient } from "@/lib/supabase/server";
import DealsManager from "@/components/admin/DealsManager";

export default async function AdminDealsPage() {
  const supabase = await createClient();

  const [{ data: settings }, { data: products }] = await Promise.all([
    supabase.from("site_settings").select("*").eq("id", 1).single(),
    supabase
      .from("products")
      .select("id, name, images, price, discount_price, is_deal")
      .eq("is_active", true)
      .order("name"),
  ]);

  return (
    <DealsManager
      dealsEnabled={settings?.deals_enabled ?? false}
      products={products ?? []}
    />
  );
}