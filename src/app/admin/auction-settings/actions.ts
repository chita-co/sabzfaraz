"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function updateAuctionSettings(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ابتدا وارد شوید." };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "ADMIN") return { error: "دسترسی غیرمجاز." };

  const admin = createAdminClient();
  const { error } = await admin.from("auction_settings").upsert({
    id: 1,
    min_topup_amount: Number(formData.get("minTopup")) || 50000,
    max_topup_amount: formData.get("maxTopup") ? Number(formData.get("maxTopup")) : null,
    manual_topup_enabled: formData.get("manualTopupEnabled") === "on",
    default_final_payment_hours: Number(formData.get("finalPaymentHours")) || 24,
    winner_discount_enabled: formData.get("winnerDiscountEnabled") === "on",
    winner_discount_percent: Number(formData.get("winnerDiscountPercent")) || 10,
    winner_discount_valid_days: Number(formData.get("winnerDiscountValidDays")) || 30,
  });
  if (error) return { error: "خطا در ذخیره تنظیمات: " + error.message };
  revalidatePath("/admin/auction-settings");
  return { success: true };
}