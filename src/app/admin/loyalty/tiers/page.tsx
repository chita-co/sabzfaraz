import { createClient } from "@/lib/supabase/server";
import LoyaltyTiersManager from "@/components/admin/LoyaltyTiersManager";

export default async function AdminLoyaltyTiersPage() {
  const supabase = await createClient();
  const { data: tiers } = await supabase.from("loyalty_tiers").select("*").order("sort_order");
  return <LoyaltyTiersManager tiers={tiers ?? []} />;
}