import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPayment } from "@/lib/zarinpal";
import { createNotification } from "@/lib/notifications";
import { sendSms } from "@/lib/sms";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const requestId = searchParams.get("requestId");
  const authority = searchParams.get("Authority");
  const status = searchParams.get("Status");
  if (!requestId || !authority) return NextResponse.redirect(`${origin}/bulk-order`);

  const admin = createAdminClient();
  const { data: bulkRequest } = await admin.from("bulk_order_requests").select("*, profile:profiles(phone)").eq("id", requestId).single();
  if (!bulkRequest) return NextResponse.redirect(`${origin}/bulk-order`);

  if (status !== "OK") {
    return NextResponse.redirect(`${origin}/bulk-order/${requestId}?deposit=failed`);
  }

  try {
    const result = await verifyPayment({ amount: bulkRequest.deposit_amount, authority });
    if (result.status === 100 || result.status === 101) {
      await admin.from("bulk_order_requests").update({
        status: "PREPARING", deposit_payment_method: "ONLINE", deposit_paid_at: new Date().toISOString(),
      }).eq("id", requestId);

      await createNotification(bulkRequest.user_id, "پرداخت بیعانه تأیید شد ✅", `پرداخت بیعانه‌ی سفارش جمعی ${bulkRequest.request_number} با موفقیت انجام شد و سفارش در حال تهیه است.`);

      const phone = bulkRequest.profile?.phone;
      if (phone) {
        try { await sendSms(phone, `سبزفراز\nبیعانه سفارش جمعی ${bulkRequest.request_number} با موفقیت پرداخت شد.`); } catch (e) { console.error(e); }
      }

      return NextResponse.redirect(`${origin}/bulk-order/${requestId}?deposit=success`);
    }
    return NextResponse.redirect(`${origin}/bulk-order/${requestId}?deposit=failed`);
  } catch {
    return NextResponse.redirect(`${origin}/bulk-order/${requestId}?deposit=error`);
  }
}