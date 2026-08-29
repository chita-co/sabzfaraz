"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendSms } from "@/lib/sms";

interface OrderWithAddress {
  order_number: string;
  address: { phone: string | null } | null;
}

export async function confirmOfflinePayment(orderId: string) {
  const supabase = await createClient();

  const { data: existingOrder } = await supabase
    .from("orders")
    .select("payment_status, order_type")
    .eq("id", orderId)
    .single();

  const { error } = await supabase.from("orders").update({ payment_status: "PAID", status: "PROCESSING" }).eq("id", orderId);
  if (error) return { error: error.message };

  if (existingOrder?.payment_status !== "PAID" && existingOrder?.order_type !== "CHINA_ORDER") {
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("product_id, quantity")
      .eq("order_id", orderId);

    for (const item of orderItems ?? []) {
      if (!item.product_id) continue;
      try {
        await supabase.rpc("decrement_product_stock", { p_product_id: item.product_id, p_qty: item.quantity });
      } catch (e) {
        console.error("خطا در کسر موجودی محصول:", e);
      }
    }
  }

  const { data } = await supabase
  .from("orders").select("order_number, address:addresses(phone)").eq("id", orderId).single();

const order = data as OrderWithAddress | null;

  const phone = order?.address?.phone;
  if (phone && order) {
    try {
      await sendSms(phone, `فروشگاه سبز فراز\nپرداخت شما تأیید شد.\nکد رهگیری سفارش: ${order.order_number}`);
    } catch (e) {
      console.error("خطا در ارسال پیامک تأیید پرداخت:", e);
    }
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true };
}