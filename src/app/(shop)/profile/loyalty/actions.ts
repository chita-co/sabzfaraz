"use server";

import { createClient } from "@/lib/supabase/server";

export async function getMyLoyaltyData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: tiers }, { data: transactions }] = await Promise.all([
    supabase.from("profiles").select("loyalty_points_balance, loyalty_points_lifetime, loyalty_tier_id").eq("id", user.id).single(),
    supabase.from("loyalty_tiers").select("*").order("sort_order"),
    supabase.from("loyalty_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30),
  ]);

  const currentTier = tiers?.find((t) => t.id === profile?.loyalty_tier_id) ?? tiers?.[0] ?? null;
  const nextTier = tiers?.find((t) => t.sort_order === (currentTier?.sort_order ?? -1) + 1) ?? null;

  const upcomingExpiry = (transactions ?? []).find((t) => t.type === "EARNED" && t.points_remaining > 0 && t.expires_at);

  return {
    balance: profile?.loyalty_points_balance ?? 0,
    lifetime: profile?.loyalty_points_lifetime ?? 0,
    currentTier, nextTier, transactions: transactions ?? [], upcomingExpiry,
  };
}