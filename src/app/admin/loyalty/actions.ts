"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateLoyaltySettings(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("loyalty_settings").update({
    toman_per_point: Number(formData.get("tomanPerPoint")),
    point_value_toman: Number(formData.get("pointValueToman")),
    min_order_for_redemption: Number(formData.get("minOrderForRedemption")),
    max_redemption_percent: Number(formData.get("maxRedemptionPercent")),
    expiry_months: Number(formData.get("expiryMonths")),
    reminder_days_before_expiry: Number(formData.get("reminderDays")),
  }).eq("id", 1);
  if (error) return { error: error.message };
  revalidatePath("/admin/loyalty/settings");
  return { success: true };
}

export async function createTier(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("loyalty_tiers").insert({
    name: formData.get("name") as string,
    min_lifetime_points: Number(formData.get("minPoints")),
    points_multiplier: Number(formData.get("multiplier")),
    free_shipping: formData.get("freeShipping") === "on",
    permanent_discount_percent: Number(formData.get("discountPercent")) || 0,
    badge_color: (formData.get("badgeColor") as string) || "#9ca3af",
    sort_order: Number(formData.get("sortOrder")) || 0,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/loyalty/tiers");
  return { success: true };
}

export async function updateTier(id: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("loyalty_tiers").update({
    name: formData.get("name") as string,
    min_lifetime_points: Number(formData.get("minPoints")),
    points_multiplier: Number(formData.get("multiplier")),
    free_shipping: formData.get("freeShipping") === "on",
    permanent_discount_percent: Number(formData.get("discountPercent")) || 0,
    badge_color: (formData.get("badgeColor") as string) || "#9ca3af",
    sort_order: Number(formData.get("sortOrder")) || 0,
  }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/loyalty/tiers");
  return { success: true };
}

export async function deleteTier(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("loyalty_tiers").delete().eq("id", id);
  if (error) return { error: "خطا در حذف — احتمالاً کاربری در این سطح قرار دارد." };
  revalidatePath("/admin/loyalty/tiers");
  return { success: true };
}

export async function adjustUserPoints(userId: string, points: number, description: string) {
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("loyalty_points_balance").eq("id", userId).single();
  if (!profile) return { error: "کاربر یافت نشد." };

  const newBalance = Math.max(0, profile.loyalty_points_balance + points);
  await supabase.from("profiles").update({ loyalty_points_balance: newBalance }).eq("id", userId);
  await supabase.from("loyalty_transactions").insert({
    user_id: userId, type: "ADJUSTMENT", points,
    points_remaining: points > 0 ? points : 0, balance_after: newBalance,
    description: description || "اصلاح دستی توسط ادمین",
    expires_at: points > 0 ? new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString() : null,
  });

  revalidatePath("/admin/loyalty/transactions");
  return { success: true };
}