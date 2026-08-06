import { createClient } from "@/lib/supabase/server";
import LoyaltySettingsForm from "@/components/admin/LoyaltySettingsForm";

export default async function AdminLoyaltySettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("loyalty_settings").select("*").eq("id", 1).single();
  return <LoyaltySettingsForm initial={data} />;
}