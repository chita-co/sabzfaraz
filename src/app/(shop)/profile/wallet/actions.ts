"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requestPayment } from "@/lib/zarinpal";
import { createNotification } from "@/lib/notifications";

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
  if (amount <= 0) return { error: "مبلغ نامعتبر است." };

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
    payment = await requestPayment({ amount, description: "شارژ کیف پول سبزفراز", callbackUrl, mobile: profile?.phone ?? "" });
  } catch {
    return { error: "خطا در اتصال به درگاه پرداخت." };
  }
  if (payment.status !== 100 || !payment.url) return { error: "اتصال به درگاه پرداخت با خطا مواجه شد." };

  await supabase.from("wallet_topup_requests").update({ zarinpal_authority: payment.authority }).eq("id", request.id);
  redirect(payment.url);
}

async function notifyAdminsOfTopupRequest(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userName: string,
  amount: number,
  method: "CARD_TO_CARD" | "SHEBA"
) {
  const { data: admins } = await supabase.from("profiles").select("id").eq("role", "ADMIN");
  const methodLabel = method === "CARD_TO_CARD" ? "کارت به کارت" : "شبا";
  for (const a of admins ?? []) {
    await createNotification(
      a.id,
      "درخواست شارژ کیف پول جدید 💳",
      `${userName} درخواست شارژ ${amount.toLocaleString("fa-IR")} تومانی از طریق ${methodLabel} ثبت کرد و منتظر تأیید شماست.`
    );
  }
}

export async function submitManualTopupRequest(amount: number, method: "CARD_TO_CARD" | "SHEBA", bankAccountId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ابتدا وارد شوید." };
  if (!amount || amount <= 0) return { error: "مبلغ نامعتبر است." };
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