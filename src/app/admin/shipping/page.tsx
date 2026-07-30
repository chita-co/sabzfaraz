import { createClient } from "@/lib/supabase/server";
import ShippingRatesManager from "@/components/admin/ShippingRatesManager";

export default async function AdminShippingPage() {
  const supabase = await createClient();
  const [{ data: rates }, { data: settings }] = await Promise.all([
    supabase.from("shipping_rates").select("*").order("province"),
    supabase.from("site_settings").select("default_shipping_cost").eq("id", 1).single(),
  ]);

  return <ShippingRatesManager rates={rates ?? []} defaultCost={settings?.default_shipping_cost ?? 0} />;
}