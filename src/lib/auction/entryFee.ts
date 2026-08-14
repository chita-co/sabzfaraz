import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function payEntryFeeFromWallet(auctionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ابتدا وارد حساب کاربری خود شوید." };

  const { data, error } = await supabase.rpc("pay_auction_entry_fee", {
    p_auction_id: auctionId,
    p_user_id: user.id,
  });
  if (error) return { error: error.message };
  return data as { success?: boolean; error?: string; required?: number; balance?: number; alreadyPaid?: boolean };
}

// برای زمانی که پرداخت هزینه شرکت مستقیم از درگاه انجام شده (نه از کیف پول)
export async function markEntryFeePaidDirect(auctionId: string, userId: string, amount: number) {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("auction_participants")
    .select("id, entry_fee_paid")
    .eq("auction_id", auctionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing?.entry_fee_paid) return;

  if (existing) {
    await admin.from("auction_participants").update({ entry_fee_paid: true, entry_fee_amount: amount }).eq("id", existing.id);
  } else {
    await admin.from("auction_participants").insert({ auction_id: auctionId, user_id: userId, entry_fee_paid: true, entry_fee_amount: amount });
  }
}