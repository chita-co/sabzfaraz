"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendSms } from "@/lib/sms";
import { completePendingCheckout } from "@/app/(shop)/checkout/pending-actions";

interface OrderWithAddress {
  order_number: string;
  pending_checkout_id: string | null;
  address: { phone: string | null } | null;
}

export async function confirmOfflinePayment(orderId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({ payment_status: "PAID", status: "PROCESSING" })
    .eq("id", orderId);
  if (error) return { error: error.message };

  const { data } = await supabase
    .from("orders")
    .select("order_number, pending_checkout_id, address:addresses(phone)")
    .eq("id", orderId)
    .single();

  const order = data as OrderWithAddress | null;

  if (order?.pending_checkout_id) {
    await completePendingCheckout(order.pending_checkout_id);
  }

  const phone = order?.address?.phone;
  if (phone && order) {
    try {
      await sendSms(
        phone,
        `فروشگاه سبز فراز\nپرداخت شما تأیید شد.\nکد رهگیری سفارش: ${order.order_number}`
      );
    } catch (e) {
      console.error("خطا در ارسال پیامک تأیید پرداخت:", e);
    }
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true };
}