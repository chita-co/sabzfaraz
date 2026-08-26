"use server";

import { createClient } from "@/lib/supabase/server";
import { requestPayment } from "@/lib/sep";
import { redirect } from "next/navigation";
import { notifyAllAdmins } from "@/lib/notifications";

export async function payDepositOnline(requestId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "دسترسی غیرمجاز" };

  const { data: request } = await supabase.from("bulk_order_requests").select("*").eq("id", requestId).eq("user_id", user.id).single();
  if (!request) return { error: "درخواست یافت نشد." };
  if (request.status !== "SUPPLY_POSSIBLE" || !request.deposit_amount) return { error: "این درخواست در حال حاضر قابل پرداخت نیست." };
  if (request.deposit_expires_at && new Date(request.deposit_expires_at) < new Date()) return { error: "مهلت پرداخت این درخواست به پایان رسیده است." };

  const { data: profile } = await supabase.from("profiles").select("phone").eq("id", user.id).single();

  const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/bulk-order/payment/callback?requestId=${requestId}`;

  let payment;
  try {
    payment = await requestPayment({
      amount: request.deposit_amount,
      resNum: requestId,
      redirectUrl: callbackUrl,
      mobile: profile?.phone ?? "",
    });
  } catch {
    return { error: "خطا در اتصال به درگاه پرداخت." };
  }

  await supabase.from("bulk_order_requests").update({ sep_token: payment.token }).eq("id", requestId);
  redirect(payment.url);
}

export async function confirmOfflineDepositPayment(requestId: string, method: "CARD_TO_CARD" | "SHEBA") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "دسترسی غیرمجاز" };

  const { data: request } = await supabase.from("bulk_order_requests").select("request_number, status").eq("id", requestId).eq("user_id", user.id).single();
  if (!request) return { error: "درخواست یافت نشد." };
  if (request.status !== "SUPPLY_POSSIBLE") return { error: "این درخواست در وضعیت قابل پرداخت نیست." };

  const { error } = await supabase.from("bulk_order_requests").update({
    status: "AWAITING_PAYMENT_CONFIRMATION", deposit_payment_method: method, updated_at: new Date().toISOString(),
  }).eq("id", requestId);
  if (error) return { error: error.message };

  await notifyAllAdmins("پرداخت بیعانه اعلام شد", `کاربر پرداخت بیعانه‌ی سفارش جمعی ${request.request_number} را از طریق ${method === "CARD_TO_CARD" ? "کارت به کارت" : "شبا"} اعلام کرد.`);

  return { success: true };
}