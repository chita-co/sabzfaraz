import { createAdminClient } from "@/lib/supabase/admin";

export async function creditWallet(userId: string, amount: number, description: string) {
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("wallet_balance").eq("id", userId).single();
  if (!profile) return { error: "کاربر یافت نشد." };

  const newBalance = profile.wallet_balance + amount;
  await admin.from("profiles").update({ wallet_balance: newBalance }).eq("id", userId);
  await admin.from("wallet_transactions").insert({
    user_id: userId, type: "credit", amount, balance_after: newBalance, description,
  });
  return { success: true, newBalance };
}