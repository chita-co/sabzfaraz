import { createClient } from "@/lib/supabase/server";
import AuctionSettingsForm from "@/components/admin/AuctionSettingsForm";

const DEFAULT_AUCTION_SETTINGS = {
  min_topup_amount: 50000,
  max_topup_amount: null,
  manual_topup_enabled: true,
  default_final_payment_hours: 24,
  winner_discount_enabled: false,
  winner_discount_percent: 10,
  winner_discount_valid_days: 30,
};

export default async function AdminAuctionSettingsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("auction_settings").select("*").eq("id", 1).maybeSingle();
  if (error) console.error("خطا در دریافت تنظیمات مزایده:", error.message);
  return <AuctionSettingsForm initial={data ?? DEFAULT_AUCTION_SETTINGS} />;
}