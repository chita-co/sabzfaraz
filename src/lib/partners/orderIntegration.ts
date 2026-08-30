import type { createClient } from "@/lib/supabase/server";

export async function attachPartnerInfoToItems(
  supabase: Awaited<ReturnType<typeof createClient>>,
  items: { productId: string }[]
) {
  const productIds = [...new Set(items.map((i) => i.productId))];
  if (productIds.length === 0) return new Map<string, { partnerId: string | null; partnerCostPrice: number | null }>();

  const { data } = await supabase.from("products").select("id, partner_id, partner_cost_price").in("id", productIds);
  const map = new Map<string, { partnerId: string | null; partnerCostPrice: number | null }>();
  (data ?? []).forEach((p) => map.set(p.id, { partnerId: p.partner_id, partnerCostPrice: p.partner_cost_price }));
  return map;
}