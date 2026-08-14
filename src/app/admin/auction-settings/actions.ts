"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateAuctionSettings(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("auction_settings").update({
    min_topup_amount: Number(formData.get("minTopup")) || 50000,
    max_topup_amount: formData.get("maxTopup") ? Number(formData.get("maxTopup")) : null,
    manual_topup_enabled: formData.get("manualTopupEnabled") === "on",
    default_final_payment_hours: Number(formData.get("finalPaymentHours")) || 24,
    winner_discount_enabled: formData.get("winnerDiscountEnabled") === "on",
    winner_discount_percent: Number(formData.get("winnerDiscountPercent")) || 10,
    winner_discount_valid_days: Number(formData.get("winnerDiscountValidDays")) || 30,
  }).eq("id", 1);
  if (error) return { error: error.message };
  revalidatePath("/admin/auction-settings");
  return { success: true };
}