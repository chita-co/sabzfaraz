"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyAllAdmins } from "@/lib/notifications";

export async function submitRefundDetails(paymentId: string, input: { holderName: string; value: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "دسترسی غیرمجاز" };

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("bulk_order_payments")
    .select("id, request_id, kind, status, method")
    .eq("id", paymentId)
    .single();
  if (!row || row.kind !== "REFUND" || row.status !== "PENDING_DETAILS") {
    return { error: "این بازپرداخت در انتظار ثبت اطلاعات نیست." };
  }

  const { data: req } = await admin
    .from("bulk_order_requests")
    .select("user_id, request_number")
    .eq("id", row.request_id)
    .single();
  if (!req || req.user_id !== user.id) return { error: "دسترسی غیرمجاز" };

  const holder = input.holderName.trim();
  if (holder.length < 3) return { error: "نام صاحب حساب را کامل وارد کنید." };

  const value = input.value.replace(/[\s-]/g, "");
  const isCard = row.method === "CARD_TO_CARD";
  if (isCard && !/^\d{16}$/.test(value)) return { error: "شماره کارت باید ۱۶ رقم باشد." };
  if (!isCard && !/^IR\d{24}$/i.test(value)) return { error: "شماره شبا باید با IR شروع شود و ۲۶ کاراکتر باشد." };

  const { error } = await admin
    .from("bulk_order_payments")
    .update({
      status: "AWAITING_PAYOUT",
      payout_holder_name: holder,
      payout_card_number: isCard ? value : null,
      payout_sheba: isCard ? null : value.toUpperCase(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", paymentId);
  if (error) return { error: error.message };

  await notifyAllAdmins(
    "اطلاعات بازپرداخت ثبت شد",
    `مشتری اطلاعات حساب برای بازپرداخت سفارش ${req.request_number} را ثبت کرد.`
  );
  return { success: true };
}