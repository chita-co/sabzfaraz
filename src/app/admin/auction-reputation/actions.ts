"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/notifications";

export async function unblacklistUser(userId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ is_auction_blacklisted: false, auction_payment_failures: 0 }).eq("id", userId);
  if (error) return { error: error.message };
  await createNotification(userId, "دسترسی مزایده بازگردانده شد", "محدودیت شرکت در مزایده‌های شما توسط پشتیبانی برداشته شد. اکنون می‌توانید دوباره در مزایده‌ها شرکت کنید.");
  revalidatePath("/admin/auction-reputation");
  return { success: true };
}

export async function adjustReputationScore(userId: string, delta: number) {
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("auction_reputation_score").eq("id", userId).single();
  if (!profile) return { error: "کاربر یافت نشد." };
  const newScore = Math.max(0, Math.min(300, profile.auction_reputation_score + delta));
  const { error } = await supabase.from("profiles").update({ auction_reputation_score: newScore }).eq("id", userId);
  if (error) return { error: error.message };
  revalidatePath("/admin/auction-reputation");
  return { success: true };
}