import { createClient } from "@/lib/supabase/server";
import StockManager from "@/components/admin/StockManager";

export default async function AdminStockPage() {
  const supabase = await createClient();
  const [{ data: settings }, { data: products }] = await Promise.all([
    supabase.from("site_settings").select("stock_enabled").eq("id", 1).single(),
    supabase.from("products").select("id, name, images, price, discount_price, is_stock").eq("is_active", true).order("name"),
  ]);
  return <StockManager stockEnabled={settings?.stock_enabled ?? false} products={products ?? []} />;
}