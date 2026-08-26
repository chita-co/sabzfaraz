import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPayment } from "@/lib/sep";
import { createNotification } from "@/lib/notifications";
import { sendSms } from "@/lib/sms";

export async function POST(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const requestId = searchParams.get("requestId");
  const formData = await request.formData();
  const refNum = formData.get("RefNum") as string | null;
  const state = formData.get("State") as string | null
  if (!requestId || !refNum) return NextResponse.redirect(`${origin}/bulk-order`);

  const admin = createAdminClient();
  const { data: bulkRequest } = await admin.from("bulk_order_requests").select("*, profile:profiles(phone)").eq("id", requestId).single();
  if (!bulkRequest) return NextResponse.redirect(`${origin}/bulk-order`);

  if (state !== "OK") {
    return NextResponse.redirect(`${origin}/bulk-order/${requestId}?deposit=failed`);
  }

  try {
    const result = await verifyPayment({ amount: bulkRequest.deposit_amount, refNum });
    if (result.ok) {
      await admin.from("bulk_order_requests").update({
        status: "PREPARING", deposit_payment_method: "ONLINE", deposit_paid_at: new Date().toISOString(),
        sep_ref_num: refNum,
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