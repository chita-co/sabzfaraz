import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPayment } from "@/lib/sep";
import { sendOrderTrackingSms } from "@/lib/sms";
import { logConversion } from "@/lib/analytics/logConversion";
import { refundRedeemedPoints } from "@/lib/loyalty/ledger";
import { refundDiscountCode } from "@/lib/discountCode";
import { refundWalletForOrder } from "@/lib/wallet/refundOrderWallet";
import { revalidatePath } from "next/cache";
import { clearUserCart } from "@/lib/cart/clearUserCart";

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "https://sabzfaraz.ir";
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

  if (!orderId || !state || (state === "OK" && !refNum)) {
    return NextResponse.redirect(`${origin}/checkout?error=invalid`);
  }

  const supabase = createAdminClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*, address:addresses(phone)")
    .eq("id", orderId)
    .single();
  if (!order) return NextResponse.redirect(`${origin}/checkout?error=notfound`);
  // محافظ callback تکراری: سفارشی که قبلاً پرداخت شده دوباره پردازش نشود
  // (وگرنه verify دوم شکست می‌خورد و سفارش پرداخت‌شده اشتباهاً لغو می‌شد)
  if (order.payment_status === "PAID") {
    return NextResponse.redirect(`${origin}/order/${orderId}?payment=success`);
  }

  if (state !== "OK" || status !== "2") {
    console.log("CALLBACK FAILED STATE", { state, status });
    await supabase.from("orders").update({ payment_status: "FAILED", status: "CANCELLED" }).eq("id", orderId);
    await clearUserCart(order.user_id);
    try { await refundRedeemedPoints(orderId); } catch (e) { console.error("خطا در بازگشت امتیاز:", e); }
    await refundDiscountCode(orderId);
    await refundWalletForOrder(orderId);
    return NextResponse.redirect(`${origin}/order/${orderId}?payment=failed`);
  }

  if (!refNum) {
    return NextResponse.redirect(`${origin}/checkout?error=invalid`);
  }

  // سفارشی که قبلاً ناموفق/لغو شده (مثلاً توسط cron سفارش‌های رهاشده) دیگر Verify نمی‌شود:
  // توکن درگاه منقضی شده و بانک تراکنش تأییدنشده را خودکار برمی‌گرداند.
  if (order.payment_status === "FAILED" && order.status === "CANCELLED") {
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
      await clearUserCart(order.user_id);
      
      const { data: orderItemsForStock } = await supabase
        .from("order_items")
        .select("product_id, quantity")
        .eq("order_id", orderId);

      if (orderItemsForStock) {
        for (const item of orderItemsForStock) {
          try {
            // دریافت موجودی فعلی محصول
            const { data: productRow } = await supabase
              .from("products")
              .select("stock")
              .eq("id", item.product_id)
              .maybeSingle();

            if (productRow && typeof productRow.stock === "number") {
              const newStock = Math.max(0, productRow.stock - item.quantity);
              await supabase
                .from("products")
                .update({ stock: newStock })
                .eq("id", item.product_id);
              // موجودی همین محصول تغییر کرد، کش صفحه‌ش هم پاک بشه.
              const { data: slugRow } = await supabase.from("products").select("slug").eq("id", item.product_id).single();
              if (slugRow?.slug) revalidatePath(`/products/${slugRow.slug}`);
            }
          } catch (e) {
            console.error("خطا در کسر موجودی محصول:", e);
          }
        }
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

      return NextResponse.redirect(`${origin}/order/${orderId}?payment=success`);
    }
    await supabase.from("orders").update({ payment_status: "FAILED", status: "CANCELLED" }).eq("id", orderId);
    await clearUserCart(order.user_id);
    try { await refundRedeemedPoints(orderId); } catch (e) { console.error("خطا در بازگشت امتیاز:", e); }
    await refundDiscountCode(orderId);
    await refundWalletForOrder(orderId);
    return NextResponse.redirect(`${origin}/order/${orderId}?payment=failed`);
  } catch {
    return NextResponse.redirect(`${origin}/order/${orderId}?payment=error`);
  }
}