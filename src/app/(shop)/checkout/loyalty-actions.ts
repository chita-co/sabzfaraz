"use server";

import { createClient } from "@/lib/supabase/server";
import { getLoyaltySettings, calculateMaxRedeemablePoints } from "@/lib/loyalty/settings";
import { calculatePointsToEarn } from "@/lib/loyalty/points-utils";
import { getUserTierMultiplier } from "@/lib/loyalty/ledger";

export async function getLoyaltyPreview(subtotal: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const settings = await getLoyaltySettings();

  if (!user) {
    return {
      balance: 0, maxRedeemable: 0,
      pointValueToman: settings.pointValueToman, minOrderForRedemption: settings.minOrderForRedemption,
      pointsToEarn: Math.floor(subtotal / settings.tomanPerPoint),
    };
  }

  const [{ data: profile }, multiplier] = await Promise.all([
    supabase.from("profiles").select("loyalty_points_balance").eq("id", user.id).single(),
    getUserTierMultiplier(user.id),
  ]);

  const balance = profile?.loyalty_points_balance ?? 0;
  const maxRedeemable = calculateMaxRedeemablePoints(subtotal, balance, settings);
  const pointsToEarn = calculatePointsToEarn(subtotal, settings.tomanPerPoint, multiplier);

  return {
    balance, maxRedeemable,
    pointValueToman: settings.pointValueToman, minOrderForRedemption: settings.minOrderForRedemption,
    pointsToEarn,
  };
}