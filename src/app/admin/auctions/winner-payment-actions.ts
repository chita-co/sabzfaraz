"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/notifications";
import { sendSms } from "@/lib/sms";
import { issueWinnerDiscountCode } from "@/lib/auction/discountCode";

export async function confirmAuctionWinnerOfflinePayment(orderId: string) {
  const supabase = await createClient();
  const { data: order } = await supabase.from("orders").select("*, address:addresses(phone)").eq("id", orderId).single();
  if (!order) return { error: "سفارش یافت نشد." };
  if (!order.related_auction_id) return { error: "این سفارش به هیچ مزایده‌ای متصل نیست." };
  if (order.payment_status !== "AWAITING_CONFIRMATION") return { error: "این سفارش در وضعیت قابل تأیید نیست." };

  const { error: orderErr } = await supabase.from("orders").update({ payment_status: "PAID" }).eq("id", orderId);
  if (orderErr) return { error: orderErr.message };

  const admin = createAdminClient();
  await admin.rpc("finalize_auction_winner_order", { p_auction_id: order.related_auction_id, p_order_id: orderId });

  const { data: items } = await supabase.from("order_items").select("product_id, quantity").eq("order_id", orderId);
  for (const item of items ?? []) {
    if (item.product_id) {
      try {
        await admin.rpc("decrement_product_stock", { p_product_id: item.product_id, p_qty: item.quantity });
      } catch (e) {
        console.error("خطا در کسر موجودی محصول:", e);
      }
    }
  }

  const discountCode = await issueWinnerDiscountCode(order.user_id, order.related_auction_id);
  const discountNote = discountCode ? ` یک کد تخفیف (${discountCode}) هم برای خرید بعدی شما صادر شد.` : "";

  await createNotification(order.user_id, "پرداخت نهایی مزایده تأیید شد ✅", `پرداخت شما برای سفارش ${order.order_number} تأیید شد و سفارش شما به‌زودی پردازش می‌شود.${discountNote}`);
  const phone = (order as { address?: { phone?: string } }).address?.phone;
  if (phone) {
    try {
      const codeLine = discountCode ? `\nکد تخفیف خرید بعدی شما: ${discountCode}` : "";
      await sendSms(phone, `سبزفراز\nپرداخت نهایی مزایده شما تأیید شد.\nکد سفارش: ${order.order_number}${codeLine}`);
    } catch (e) {
      console.error("خطا در ارسال پیامک:", e);
    }
  }

  revalidatePath(`/admin/auctions/${order.related_auction_id}`);
  revalidatePath("/admin/orders");
  return { success: true };
}

export async function rejectAuctionWinnerOfflinePayment(orderId: string, reason: string) {
  const supabase = await createClient();
  const { data: order } = await supabase.from("orders").select("user_id, order_number, related_auction_id, payment_status").eq("id", orderId).single();
  if (!order) return { error: "سفارش یافت نشد." };
  if (order.payment_status !== "AWAITING_CONFIRMATION") return { error: "این سفارش در وضعیت قابل رد نیست." };

  const { error } = await supabase.from("orders").update({ payment_status: "FAILED" }).eq("id", orderId);
  if (error) return { error: error.message };

  await createNotification(
    order.user_id,
    "پرداخت نهایی مزایده رد شد",
    `پرداخت شما برای سفارش ${order.order_number} تأیید نشد. دلیل: ${reason}. لطفاً دوباره اقدام کنید یا با پشتیبانی تماس بگیرید.`
  );

  if (order.related_auction_id) revalidatePath(`/admin/auctions/${order.related_auction_id}`);
  revalidatePath("/admin/orders");
  return { success: true };
}