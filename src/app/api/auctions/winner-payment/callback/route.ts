import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPayment } from "@/lib/zarinpal";
import { sendSms } from "@/lib/sms";
import { issueWinnerDiscountCode } from "@/lib/auction/discountCode";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const orderId = searchParams.get("orderId");
  const authority = searchParams.get("Authority");
  const status = searchParams.get("Status");
  if (!orderId || !authority) return NextResponse.redirect(`${origin}/profile/auctions?payment=invalid`);

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("*, address:addresses(phone)")
    .eq("id", orderId)
    .single();
  if (!order || !order.related_auction_id) return NextResponse.redirect(`${origin}/profile/auctions?payment=notfound`);

  if (status !== "OK") {
    await admin.from("orders").update({ payment_status: "FAILED" }).eq("id", orderId);
    return NextResponse.redirect(`${origin}/auctions/${order.related_auction_id}/pay?payment=failed`);
  }

  try {
    const result = await verifyPayment({ amount: order.total_amount, authority });
    if (result.status === 100 || result.status === 101) {
      await admin
        .from("orders")
        .update({ payment_status: "PAID", zarinpal_ref_id: String(result.refId ?? "") })
        .eq("id", orderId);

      await admin.rpc("finalize_auction_winner_order", { p_auction_id: order.related_auction_id, p_order_id: orderId });

      const { data: items } = await admin.from("order_items").select("product_id, quantity").eq("order_id", orderId);
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

      const phone = (order as { address?: { phone?: string } }).address?.phone;
      if (phone) {
        try {
          const codeLine = discountCode ? `\nکد تخفیف خرید بعدی شما: ${discountCode}` : "";
          await sendSms(phone, `سبزفراز\nپرداخت نهایی مزایده با موفقیت انجام شد.\nکد سفارش: ${order.order_number}${codeLine}`);
        } catch (e) {
          console.error("خطا در ارسال پیامک:", e);
        }
      }

      return NextResponse.redirect(`${origin}/order/${orderId}?payment=success`);
    }
    await admin.from("orders").update({ payment_status: "FAILED" }).eq("id", orderId);
    return NextResponse.redirect(`${origin}/auctions/${order.related_auction_id}/pay?payment=failed`);
  } catch {
    return NextResponse.redirect(`${origin}/auctions/${order.related_auction_id}/pay?payment=error`);
  }
}