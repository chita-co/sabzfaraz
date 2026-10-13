import { createAdminClient } from "@/lib/supabase/admin";

// برداشت از کیف پول کاربر؛ مشابه creditWallet
export async function debitWallet(userId: string, amount: number, description: string) {
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("wallet_balance").eq("id", userId).single();
  if (!profile) return { error: "کاربر یافت نشد." };

  const current = Number(profile.wallet_balance ?? 0);
  if (current < amount) return { error: "موجودی کیف پول شما کافی نیست." };

  const newBalance = current - amount;
  // قفل خوش‌بینانه: فقط اگر موجودی تغییری نکرده باشد به‌روز می‌شود
  const { data: updated, error } = await admin
    .from("profiles")
    .update({ wallet_balance: newBalance })
    .eq("id", userId)
    .eq("wallet_balance", current)
    .select("id");
  if (error) return { error: error.message };
  if (!updated || updated.length === 0) return { error: "خطا در برداشت از کیف پول. دوباره تلاش کنید." };

  await admin.from("wallet_transactions").insert({
    user_id: userId,
    type: "debit",
    amount,
    balance_after: newBalance,
    description,
  });
  return { success: true, newBalance };
}