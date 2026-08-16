"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { runAuctionBotsOnce } from "@/lib/auction/runBots";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ابتدا وارد شوید." } as const;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "ADMIN") return { error: "دسترسی غیرمجاز." } as const;
  return { userId: user.id } as const;
}

export async function updateBotSettings(formData: FormData) {
  const check = await requireAdmin();
  if ("error" in check) return { error: check.error };

  const names = (formData.get("botNames") as string).split("\n").map((n) => n.trim()).filter(Boolean);
  // نوشتن با کلاینت ادمین (service role) که همیشه موفق است، مستقل از هر پیچیدگی RLS
  const admin = createAdminClient();
  const { error } = await admin.from("auction_bot_settings").upsert({
    id: 1,
    enabled_global: formData.get("enabledGlobal") === "on",
    bots_per_auction: Number(formData.get("botsPerAuction")) || 5,
    min_interval_minutes: Number(formData.get("minInterval")) || 20,
    max_interval_minutes: Number(formData.get("maxInterval")) || 40,
    stop_after_real_bid: formData.get("stopAfterRealBid") === "on",
    end_behavior: formData.get("endBehavior") as string,
    bot_names: names.length > 0 ? names : ["کاربر مزایده"],
  });
  if (error) return { error: "خطا در ذخیره تنظیمات: " + error.message };
  revalidatePath("/admin/auction-bots");
  return { success: true };
}

export async function runBotsManually() {
  const check = await requireAdmin();
  if ("error" in check) return { error: check.error };
  const result = await runAuctionBotsOnce();
  return result;
}