import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPayment } from "@/lib/zarinpal";
import { sendSms } from "@/lib/sms";
import { logConversion } from "@/lib/analytics/logConversion";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const orderId = searchParams.get("orderId");
  const authority = searchParams.get("Authority");
  const status = searchParams.get("Status");

  if (!orderId || !authority) {
    return NextResponse.redirect(`${origin}/checkout?error=invalid`);
  }

  const supabase = createAdminClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*, address:addresses(phone)")
    .eq("id", orderId)
    .single();
  if (!order) return NextResponse.redirect(`${origin}/checkout?error=notfound`);

  if (status !== "OK") {
    await supabase.from("orders").update({ payment_status: "FAILED", status: "CANCELLED" }).eq("id", orderId);
    return NextResponse.redirect(`${origin}/order/${orderId}?payment=failed`);
  }

  try {
    const result = await verifyPayment({ amount: order.total_amount, authority });
    if (result.status === 100 || result.status === 101) {
      await supabase.from("orders").update({
        payment_status: "PAID",
        status: "PROCESSING",
        zarinpal_ref_id: String(result.refId ?? ""),
      }).eq("id", orderId);

      // کسر موجودی بر اساس اقلام سفارش
      const { data: orderItemsForStock } = await supabase
        .from("order_items")
        .select("product_id, quantity")
        .eq("order_id", orderId);

      if (orderItemsForStock) {
        for (const item of orderItemsForStock) {
          await supabase.rpc("decrement_product_stock", {
            p_product_id: item.product_id,
            p_qty: item.quantity,
          });
        }
      }

      const phone = order.address?.phone;
      if (phone) {
        try {
          await sendSms(phone, `فروشگاه سبز فراز\nکد رهگیری سفارش: ${order.order_number}`);
        } catch (e) {
          console.error("خطا در ارسال پیامک تایید سفارش:", e);
        }
      }

      const sessionKeyCookie = request.cookies.get("sf_analytics_session")?.value ?? null;
      try {
        await logConversion(sessionKeyCookie, orderId, order.total_amount);
      } catch (e) {
        console.error("خطا در ثبت تبدیل آماری:", e);
      }

      return NextResponse.redirect(`${origin}/order/${orderId}?payment=success`);
    }
    await supabase.from("orders").update({ payment_status: "FAILED", status: "CANCELLED" }).eq("id", orderId);
    return NextResponse.redirect(`${origin}/order/${orderId}?payment=failed`);
  } catch {
    return NextResponse.redirect(`${origin}/order/${orderId}?payment=error`);
  }
}