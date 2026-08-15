import { createClient } from "@/lib/supabase/server";
import BotSettingsForm from "@/components/admin/BotSettingsForm";

const DEFAULT_BOT_SETTINGS = {
  enabled_global: false,
  bot_names: [
    "علی رضایی", "محمد احمدی", "فاطمه کریمی", "زهرا محمدی", "حسین صادقی",
    "مریم نوری", "امیر حسینی", "سارا جعفری", "رضا مرادی", "نگار قاسمی",
  ],
  bots_per_auction: 5,
  min_interval_minutes: 20,
  max_interval_minutes: 40,
  stop_after_real_bid: false,
  end_behavior: "CANCEL",
};

export default async function AdminAuctionBotsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("auction_bot_settings").select("*").eq("id", 1).maybeSingle();
  if (error) console.error("خطا در دریافت تنظیمات ربات‌ها:", error.message);
  return <BotSettingsForm initial={data ?? DEFAULT_BOT_SETTINGS} />;
}