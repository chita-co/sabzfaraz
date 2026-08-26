import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPayment } from "@/lib/sep";
import { sendSms } from "@/lib/sms";

export async function POST(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const orderId = searchParams.get("orderId");
  const formData = await request.formData();
  const refNum = formData.get("RefNum") as string | null;
  const state = formData.get("State") as string | null;
  if (!orderId || !refNum) return NextResponse.redirect(`${origin}/profile/orders?payment=invalid`);

  const admin = createAdminClient();
  const { data: order } = await admin.from("orders").select("*, address:addresses(phone)").eq("id", orderId).single();
  if (!order || !order.related_reverse_auction_id) return NextResponse.redirect(`${origin}/profile/orders?payment=notfound`);

  if (state !== "OK") {
    await admin.from("orders").update({ payment_status: "FAILED" }).eq("id", orderId);
    return NextResponse.redirect(`${origin}/reverse-auctions/${order.related_reverse_auction_id}/pay?payment=failed`);
  }

  try {
    const result = await verifyPayment({ amount: order.total_amount, refNum });
    if (result.ok) {
      await admin.from("orders").update({ payment_status: "PAID", sep_ref_num: refNum }).eq("id", orderId);

      await admin.rpc("finalize_reverse_auction_order", { p_reverse_auction_id: order.related_reverse_auction_id, p_order_id: orderId });

      const { data: items } = await admin.from("order_items").select("product_id, quantity").eq("order_id", orderId);
      for (const item of items ?? []) {
        if (item.product_id) {
          try { await admin.rpc("decrement_product_stock", { p_product_id: item.product_id, p_qty: item.quantity }); }
          catch (e) { console.error("خطا در کسر موجودی محصول:", e); }
        }
      }

      const phone = (order as { address?: { phone?: string } }).address?.phone;
      if (phone) {
        try { await sendSms(phone, `سبزفراز\nپرداخت خرید حراج معکوس با موفقیت انجام شد.\nکد سفارش: ${order.order_number}`); }
        catch (e) { console.error("خطا در ارسال پیامک:", e); }
      }

      return NextResponse.redirect(`${origin}/order/${orderId}?payment=success`);
    }
    await admin.from("orders").update({ payment_status: "FAILED" }).eq("id", orderId);
    return NextResponse.redirect(`${origin}/reverse-auctions/${order.related_reverse_auction_id}/pay?payment=failed`);
  } catch {
    return NextResponse.redirect(`${origin}/reverse-auctions/${order.related_reverse_auction_id}/pay?payment=error`);
  }
}