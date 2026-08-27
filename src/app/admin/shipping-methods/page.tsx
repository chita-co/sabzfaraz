import { createClient } from "@/lib/supabase/server";
import ShippingMethodsManager from "@/components/admin/ShippingMethodsManager";

export default async function AdminShippingMethodsPage() {
  const supabase = await createClient();
  const [{ data: methods }, { data: tiers }] = await Promise.all([
    supabase.from("shipping_methods").select("*").order("sort_order"),
    supabase.from("shipping_weight_tiers").select("*"),
  ]);

  const combined = (methods ?? []).map((m) => ({
    id: m.id, name: m.name, is_active: m.is_active, invoice_label: m.invoice_label,
    tiers: (tiers ?? []).filter((t) => t.method_id === m.id),
  }));

  return <ShippingMethodsManager methods={combined} />;
}