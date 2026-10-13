"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requestPayment } from "@/lib/sep";
import { redirect } from "next/navigation";
import { notifyAllAdmins } from "@/lib/notifications";
import { addBulkPayment, canPayBalance, loadBulkMoney } from "@/lib/bulkOrder/orderMirror";
import { debitWallet } from "@/lib/wallet/debitWallet";

export async function payBalanceOnline(requestId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "دسترسی غیرمجاز" };

  const admin = createAdminClient();
  const { request, money, error } = await loadBulkMoney(admin, requestId);
  if (error || !request || !money) return { error: error ?? "درخواست یافت نشد." };
  if (request.user_id !== user.id) return { error: "درخواست یافت نشد." };

  const block = canPayBalance(request, money);
  if (block) return { error: block };
  const amount = money.balance as number;

  const { data: profile } = await supabase.from("profiles").select("phone").eq("id", user.id).single();
  const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/bulk-order/payment/callback?requestId=${requestId}&kind=BALANCE`;

  let payment;
  try {
    payment = await requestPayment({
      amount,
      resNum: requestId,
      redirectUrl: callbackUrl,
      mobile: profile?.phone ?? "",
    });
  } catch {
    return { error: "خطا در اتصال به درگاه پرداخت." };
  }

  const ledgerError = await addBulkPayment(admin, request, {
    kind: "BALANCE",
    method: "ONLINE",
    amount,
    status: "PENDING",
    sep_token: payment.token,
  });
  if (ledgerError) return { error: "خطا در ثبت پرداخت: " + ledgerError };

  redirect(payment.url);
}

export async function confirmOfflineBalancePayment(requestId: string, method: "CARD_TO_CARD" | "SHEBA") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "دسترسی غیرمجاز" };

  const admin = createAdminClient();
  const { request, money, error } = await loadBulkMoney(admin, requestId);
  if (error || !request || !money) return { error: error ?? "درخواست یافت نشد." };
  if (request.user_id !== user.id) return { error: "درخواست یافت نشد." };

  const block = canPayBalance(request, money);
  if (block) return { error: block };
  const amount = money.balance as number;

  const ledgerError = await addBulkPayment(admin, request, {
    kind: "BALANCE",
    method,
    amount,
    status: "AWAITING_CONFIRMATION",
  });
  if (ledgerError) return { error: "خطا در ثبت پرداخت: " + ledgerError };

  await notifyAllAdmins(
    "واریز مانده‌ی سفارش جمعی اعلام شد",
    `کاربر واریز ${amount.toLocaleString("fa-IR")} تومان مانده‌ی سفارش ${request.request_number} را از طریق ${method === "CARD_TO_CARD" ? "کارت به کارت" : "شبا"} اعلام کرد.`
  );

  return { success: true };
}

export async function payBalanceWallet(requestId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "دسترسی غیرمجاز" };

  const admin = createAdminClient();
  const { request, money, error } = await loadBulkMoney(admin, requestId);
  if (error || !request || !money) return { error: error ?? "درخواست یافت نشد." };
  if (request.user_id !== user.id) return { error: "درخواست یافت نشد." };

  const block = canPayBalance(request, money);
  if (block) return { error: block };
  const amount = money.balance as number;

  const debit = await debitWallet(user.id, amount, `پرداخت مانده‌ی سفارش جمعی ${request.request_number}`);
  if (debit.error) return { error: debit.error };

  const ledgerError = await addBulkPayment(admin, request, {
    kind: "BALANCE",
    method: "WALLET",
    amount,
    status: "PAID",
  });
  if (ledgerError) return { error: "پرداخت انجام شد ولی ثبت آن با خطا مواجه شد: " + ledgerError };

  await notifyAllAdmins(
    "مانده‌ی سفارش جمعی از کیف پول پرداخت شد",
    `کاربر مبلغ ${amount.toLocaleString("fa-IR")} تومان از کیف پول بابت سفارش ${request.request_number} پرداخت کرد.`
  );
  return { success: true };
}