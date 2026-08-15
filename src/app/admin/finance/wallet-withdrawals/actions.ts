"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createPlatformWithdrawal(amount: number, bankAccountId: string, note: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ابتدا وارد شوید." };
  if (amount <= 0) return { error: "مبلغ نامعتبر است." };

  const { error } = await supabase.from("wallet_platform_withdrawals").insert({
    amount, bank_account_id: bankAccountId, note, admin_id: user.id,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/finance/wallet-withdrawals");
  return { success: true };
}