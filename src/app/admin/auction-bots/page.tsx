import { createClient } from "@/lib/supabase/server";
import BotSettingsForm from "@/components/admin/BotSettingsForm";

export default async function AdminAuctionBotsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("auction_bot_settings").select("*").eq("id", 1).single();
  return <BotSettingsForm initial={data} />;
}