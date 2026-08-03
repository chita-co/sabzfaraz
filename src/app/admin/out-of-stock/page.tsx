import { createClient } from "@/lib/supabase/server";
import OutOfStockManager from "@/components/admin/OutOfStockManager";

export default async function AdminOutOfStockPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, name, sku, images")
    .eq("stock", 0)
    .order("name");

  return <OutOfStockManager products={products ?? []} />;
}