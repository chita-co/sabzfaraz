import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPayment } from "@/lib/sep";
import { sendOrderTrackingSms } from "@/lib/sms";
import { logConversion } from "@/lib/analytics/logConversion";
import { refundRedeemedPoints } from "@/lib/loyalty/ledger";
import { creditPartnersForOrder } from "@/lib/partners/wallet";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const orderId = searchParams.get("orderId");
  const formData = await request.formData();
  const refNum = formData.get("RefNum") as string | null;
  const state = formData.get("State") as string | null;
  const status = formData.get("Status") as string | null;

  console.log("CALLBACK RECEIVED", {
    orderId,
    refNum,
    state,
    status,
    allFields: Object.fromEntries(formData.entries()),
  });

  if (!orderId || !refNum) {
    return NextResponse.redirect(`${origin}/checkout?error=invalid`);
  }

  const supabase = createAdminClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*, address:addresses(phone)")
    .eq("id", orderId)
    .single();
  if (!order) return NextResponse.redirect(`${origin}/checkout?error=notfound`);

  if (state !== "OK" || status !== "2") {
    console.log("CALLBACK FAILED STATE", { state, status });
    await supabase.from("orders").update({ payment_status: "FAILED", status: "CANCELLED" }).eq("id", orderId);
    try { await refundRedeemedPoints(orderId); } catch (e) { console.error("خطا در بازگشت امتیاز:", e); }
    return NextResponse.redirect(`${origin}/order/${orderId}?payment=failed`);
  }

  try {
    const result = await verifyPayment({ amount: order.gateway_amount ?? order.total_amount, refNum });

    console.log("VERIFY RESULT", {
  refNum,
  ok: result.ok,
  raw: result.raw,
});

    if (result.ok) {
      await supabase.from("orders").update({
        payment_status: "PAID",
        status: "PROCESSING",
        sep_ref_num: refNum,
      }).eq("id", orderId);
      
      const { data: orderItemsForStock } = await supabase
        .from("order_items")
        .select("product_id, quantity")
        .eq("order_id", orderId);

      if (orderItemsForStock) {
        for (const item of orderItemsForStock) {
          try {
            await supabase.rpc("decrement_product_stock", {
              p_product_id: item.product_id,
              p_qty: item.quantity,
            });
          } catch (e) {
            console.error("خطا در کسر موجودی محصول:", e);
          }
        }
      }

      try {
        await creditPartnersForOrder(orderId);
      } catch (e) {
        console.error("خطا در واریز به کیف پول همکار:", e);
      }

      const phone = order.address?.phone;
      if (phone) {
        try {
          await sendOrderTrackingSms(phone, order.order_number);
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

            // ✅ تازه‌سازی session کاربر قبل از redirect به صفحه موفقیت
      const userSupabase = await createClient();
      await userSupabase.auth.getUser();

      return NextResponse.redirect(`${origin}/order/${orderId}?payment=success`);
    }
    await supabase.from("orders").update({ payment_status: "FAILED", status: "CANCELLED" }).eq("id", orderId);
    try { await refundRedeemedPoints(orderId); } catch (e) { console.error("خطا در بازگشت امتیاز:", e); }
    return NextResponse.redirect(`${origin}/order/${orderId}?payment=failed`);
  } catch {
    return NextResponse.redirect(`${origin}/order/${orderId}?payment=error`);
  }
}