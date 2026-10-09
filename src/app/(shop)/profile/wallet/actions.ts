"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requestPayment } from "@/lib/sep";
import { notifyAllAdmins } from "@/lib/notifications";

async function validateTopupAmount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  amount: number
): Promise<string | null> {
  if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount <= 0) {
    return "مبلغ نامعتبر است.";
  }
  const { data: settings } = await supabase
    .from("auction_settings").select("min_topup_amount, max_topup_amount").eq("id", 1).single();
  const min = settings?.min_topup_amount ?? 50000;
  const max = settings?.max_topup_amount ?? null;
  if (amount < min) return `حداقل مبلغ شارژ ${min.toLocaleString("fa-IR")} تومان است.`;
  if (max && amount > max) return `حداکثر مبلغ شارژ ${max.toLocaleString("fa-IR")} تومان است.`;
  return null;
}

export async function getMyWalletData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: transactions }, { data: pendingRequests }, { data: settings }, { data: bankAccounts }] = await Promise.all([
    supabase.from("profiles").select("wallet_balance").eq("id", user.id).single(),
    supabase.from("wallet_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
    supabase.from("wallet_topup_requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
    supabase.from("auction_settings").select("*").eq("id", 1).single(),
    supabase.from("bank_accounts").select("*").eq("is_active", true).order("sort_order"),
  ]);

  return {
    balance: profile?.wallet_balance ?? 0,
    transactions: transactions ?? [],
    pendingRequests: pendingRequests ?? [],
    minTopup: settings?.min_topup_amount ?? 50000,
    maxTopup: settings?.max_topup_amount ?? null,
    manualTopupEnabled: settings?.manual_topup_enabled ?? true,
    bankAccounts: bankAccounts ?? [],
  };
}

export async function topUpWalletOnline(amount: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ابتدا وارد شوید." };
  const amountError = await validateTopupAmount(supabase, amount);
  if (amountError) return { error: amountError };

  const { data: profile } = await supabase.from("profiles").select("phone").eq("id", user.id).single();

  const { data: request, error: insertError } = await supabase
    .from("wallet_topup_requests")
    .insert({ user_id: user.id, amount, method: "ONLINE", status: "PENDING" })
    .select("id")
    .single();
  if (insertError || !request) return { error: "خطا در ثبت درخواست شارژ." };

  const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/wallet/topup/callback?requestId=${request.id}`;

  let payment;
  try {
    payment = await requestPayment({
      amount,
      resNum: request.id,
      redirectUrl: callbackUrl,
      mobile: profile?.phone ?? "",
    });
  } catch {
    return { error: "خطا در اتصال به درگاه پرداخت." };
  }

  await supabase.from("wallet_topup_requests").update({ sep_token: payment.token }).eq("id", request.id);
  redirect(payment.url);
}


async function notifyAdminsOfTopupRequest(
  _supabase: Awaited<ReturnType<typeof createClient>>,
  userName: string,
  amount: number,
  method: "CARD_TO_CARD" | "SHEBA"
) {
  const methodLabel = method === "CARD_TO_CARD" ? "کارت به کارت" : "شبا";
  await notifyAllAdmins(
    "درخواست شارژ کیف پول جدید 💳",
    `${userName} درخواست شارژ ${amount.toLocaleString("fa-IR")} تومانی از طریق ${methodLabel} ثبت کرد و منتظر تأیید شماست.`
  );
}

export async function submitManualTopupRequest(amount: number, method: "CARD_TO_CARD" | "SHEBA", bankAccountId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ابتدا وارد شوید." };
  const amountError = await validateTopupAmount(supabase, amount);
  if (amountError) return { error: amountError };
  if (!bankAccountId) return { error: "لطفاً یک حساب بانکی انتخاب کنید." };

  const { error } = await supabase.from("wallet_topup_requests").insert({
    user_id: user.id, amount, method, bank_account_id: bankAccountId, status: "PENDING",
  });
  if (error) return { error: error.message };

  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
  await notifyAdminsOfTopupRequest(supabase, profile?.full_name ?? "یک کاربر", amount, method);

  revalidatePath("/profile/wallet");
  return { success: true };
}