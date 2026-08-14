"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateBotSettings(formData: FormData) {
  const supabase = await createClient();
  const names = (formData.get("botNames") as string).split("\n").map((n) => n.trim()).filter(Boolean);
  const { error } = await supabase.from("auction_bot_settings").update({
    enabled_global: formData.get("enabledGlobal") === "on",
    bots_per_auction: Number(formData.get("botsPerAuction")) || 5,
    min_interval_minutes: Number(formData.get("minInterval")) || 20,
    max_interval_minutes: Number(formData.get("maxInterval")) || 40,
    stop_after_real_bid: formData.get("stopAfterRealBid") === "on",
    end_behavior: formData.get("endBehavior") as string,
    bot_names: names,
  }).eq("id", 1);
  if (error) return { error: error.message };
  revalidatePath("/admin/auction-bots");
  return { success: true };
}