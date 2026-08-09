import { createClient } from "@/lib/supabase/server";

export async function getLegacyShippingCost(province: string, city: string): Promise<number> {
  const supabase = await createClient();

  const { data: exact } = await supabase
    .from("shipping_rates").select("cost").eq("province", province).eq("city", city).maybeSingle();
  if (exact) return exact.cost;

  const { data: provinceWide } = await supabase
    .from("shipping_rates").select("cost").eq("province", province).is("city", null).maybeSingle();
  if (provinceWide) return provinceWide.cost;

  const { data: settings } = await supabase.from("site_settings").select("default_shipping_cost").eq("id", 1).single();
  return settings?.default_shipping_cost ?? 0;
}