import { createClient } from "@/lib/supabase/server";

export interface LoyaltySettings {
  tomanPerPoint: number;
  pointValueToman: number;
  minOrderForRedemption: number;
  maxRedemptionPercent: number;
  expiryMonths: number;
  reminderDaysBeforeExpiry: number;
}

export async function getLoyaltySettings(): Promise<LoyaltySettings> {
  const supabase = await createClient();
  const { data } = await supabase.from("loyalty_settings").select("*").eq("id", 1).single();
  return {
    tomanPerPoint: data?.toman_per_point ?? 1000,
    pointValueToman: data?.point_value_toman ?? 100,
    minOrderForRedemption: data?.min_order_for_redemption ?? 200000,
    maxRedemptionPercent: data?.max_redemption_percent ?? 20,
    expiryMonths: data?.expiry_months ?? 6,
    reminderDaysBeforeExpiry: data?.reminder_days_before_expiry ?? 7,
  };
}

export function calculateMaxRedeemablePoints(subtotal: number, userBalance: number, settings: LoyaltySettings): number {
  if (subtotal < settings.minOrderForRedemption) return 0;
  const maxByPercent = Math.floor((subtotal * settings.maxRedemptionPercent) / 100 / settings.pointValueToman);
  return Math.max(0, Math.min(userBalance, maxByPercent));
}

export function calculatePointsToEarn(amount: number, tomanPerPoint: number, multiplier = 1): number {
  if (tomanPerPoint <= 0) return 0;
  return Math.floor((amount / tomanPerPoint) * multiplier);
}