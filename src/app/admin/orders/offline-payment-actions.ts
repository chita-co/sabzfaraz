"use server";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { sendSms } from "@/lib/sms";
import { deleteUserCartAction } from "@/app/admin/carts/actions";

interface OrderWithAddress {
  order_number: string;
  user_id: string;
  address: { phone: string | null } | null;
}

export async function confirmOfflinePayment(orderId: string) {
  await requireAdmin();
  const supabase = await createClient();

  {
    const { data: guard } = await supabase.from("orders").select("order_type").eq("id", orderId).single();
    if (guard?.order_type === "BULK_ORDER") {
      return { error: "سفارش جمعی از بخش «سفارش‌های جمعی» تأیید می‌شود." };
    }
  }

  const { data: existingOrder } = await supabase
    .from("orders")
    .select("payment_status, order_type, user_id")
    .eq("id", orderId)
    .single();

  const { error } = await supabase.from("orders").update({ payment_status: "PAID", status: "PROCESSING" }).eq("id", orderId);
  if (error) return { error: error.message };
  if (existingOrder?.user_id) {
    await deleteUserCartAction(existingOrder.user_id);
  }

  if (existingOrder?.payment_status !== "PAID" && existingOrder?.order_type !== "CHINA_ORDER") {
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("product_id, quantity, is_bubble_deal")
      .eq("order_id", orderId);

    for (const item of orderItems ?? []) {
      if (!item.product_id) continue;
      try {
        await supabase.rpc("decrement_product_stock", { p_product_id: item.product_id, p_qty: item.quantity });
        if (item.is_bubble_deal) {
          await createAdminClient().rpc("decrement_bubble_stock", { p_product_id: item.product_id, p_qty: item.quantity });
        }
        const { data: slugRow } = await supabase.from("products").select("slug").eq("id", item.product_id).single();
        if (slugRow?.slug) revalidatePath(`/products/${slugRow.slug}`);
      } catch (e) {
        console.error("خطا در کسر موجودی محصول:", e);
      }
    }
  }

  const { data } = await supabase
  .from("orders").select("order_number, address:addresses(phone)").eq("id", orderId).single();

const order = data as OrderWithAddress | null;

if (order?.user_id) {
    await deleteUserCartAction(order.user_id);
  }

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

export async function rejectOfflinePayment(orderId: string) {
  await requireAdmin();
  const supabase = await createClient();
  {
    const { data: guard } = await supabase.from("orders").select("order_type").eq("id", orderId).single();
    if (guard?.order_type === "BULK_ORDER") {
      return { error: "سفارش جمعی از بخش «سفارش‌های جمعی» تأیید می‌شود." };
    }
  }
  const { error } = await supabase.from("orders").update({ payment_status: "FAILED" }).eq("id", orderId);
  if (error) return { error: error.message };

  const { data } = await supabase
    .from("orders").select("order_number, user_id, address:addresses(phone)").eq("id", orderId).single();

  const order = data as OrderWithAddress | null;
  const phone = order?.address?.phone;
  if (phone && order) {
    try {
      await sendSms(phone, `فروشگاه سبز فراز\nپرداخت شما تأیید نشد. لطفاً برای پیگیری با پشتیبانی تماس بگیرید.\nکد سفارش: ${order.order_number}`);
    } catch (e) {
      console.error("خطا در ارسال پیامک رد پرداخت:", e);
    }
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true };
}