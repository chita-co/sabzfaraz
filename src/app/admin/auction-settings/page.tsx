import { createClient } from "@/lib/supabase/server";
import AuctionSettingsForm from "@/components/admin/AuctionSettingsForm";

export default async function AdminAuctionSettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("auction_settings").select("*").eq("id", 1).single();
  return <AuctionSettingsForm initial={data} />;
}