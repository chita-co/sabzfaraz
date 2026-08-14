import { createAdminClient } from "@/lib/supabase/admin";
import { randomBytes } from "crypto";

function generateCode(): string {
  return "WIN-" + randomBytes(4).toString("hex").toUpperCase();
}

export async function issueWinnerDiscountCode(userId: string, auctionId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data: settings } = await admin
    .from("auction_settings")
    .select("winner_discount_enabled, winner_discount_percent, winner_discount_valid_days")
    .eq("id", 1)
    .single();

  if (!settings?.winner_discount_enabled) return null;

  const code = generateCode();
  const expiresAt = new Date(Date.now() + (settings.winner_discount_valid_days ?? 30) * 86400000).toISOString();

  const { data, error } = await admin
    .from("discount_codes")
    .insert({
      code,
      type: "PERCENT",
      value: settings.winner_discount_percent ?? 10,
      max_uses: 1,
      user_id: userId,
      related_auction_id: auctionId,
      expires_at: expiresAt,
    })
    .select("code")
    .single();

  if (error) {
    console.error("خطا در صدور کد تخفیف برنده مزایده:", error);
    return null;
  }
  return data?.code ?? null;
}