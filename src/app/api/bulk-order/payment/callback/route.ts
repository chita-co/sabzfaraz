import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPayment } from "@/lib/sep";
import { createNotification, notifyAllAdmins } from "@/lib/notifications";
import { sendSms } from "@/lib/sms";
import { settleBulkPayment, getPendingAmount } from "@/lib/bulkOrder/orderMirror";

export async function POST(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const requestId = searchParams.get("requestId");
  const kind = searchParams.get("kind") === "BALANCE" ? "BALANCE" : "DEPOSIT";
  const formData = await request.formData();
  const refNum = formData.get("RefNum") as string | null;
  const state = formData.get("State") as string | null;
  if (!requestId || !refNum) return NextResponse.redirect(`${origin}/bulk-order`);

  const admin = createAdminClient();
  const { data: bulkRequest } = await admin
    .from("bulk_order_requests")
    .select("*, profile:profiles(phone)")
    .eq("id", requestId)
    .single();
  if (!bulkRequest) return NextResponse.redirect(`${origin}/bulk-order`);

  const backBase = kind === "BALANCE" ? `${origin}/profile/orders` : `${origin}/bulk-order/${requestId}`;
  const param = kind === "BALANCE" ? "balance" : "deposit";
  const go = (status: string) => NextResponse.redirect(`${backBase}?${param}=${status}`);

  if (state !== "OK") {
    await settleBulkPayment(admin, requestId, {
      kind,
      from: ["PENDING"],
      to: "FAILED",
      method: "ONLINE",
      refNum,
      error: `State=${state ?? "null"}`,
    });
    return go("failed");
  }

  try {
    const amount =
      kind === "DEPOSIT" ? bulkRequest.deposit_amount : await getPendingAmount(admin, requestId, "BALANCE");
    if (!amount) throw new Error("مبلغ پرداخت معلق یافت نشد.");

    const result = await verifyPayment({ amount, refNum });

    if (result.ok) {
      if (kind === "DEPOSIT") {
        await admin
          .from("bulk_order_requests")
          .update({
            status: "PREPARING",
            deposit_payment_method: "ONLINE",
            deposit_paid_at: new Date().toISOString(),
            sep_ref_num: refNum,
          })
          .eq("id", requestId);
      }

      await settleBulkPayment(admin, requestId, {
        kind,
        from: ["PENDING"],
        to: "PAID",
        method: "ONLINE",
        refNum,
        error: null,
      });

      if (kind === "DEPOSIT") {
        await createNotification(
          bulkRequest.user_id,
          "پرداخت بیعانه تأیید شد ✅",
          `پرداخت بیعانه‌ی سفارش جمعی ${bulkRequest.request_number} با موفقیت انجام شد و سفارش در حال تهیه است.`
        );
        await notifyAllAdmins(
          "پرداخت آنلاین بیعانه موفق بود",
          `بیعانه‌ی سفارش جمعی ${bulkRequest.request_number} از طریق درگاه پرداخت شد. کد پیگیری: ${refNum}`
        );
        const phone = bulkRequest.profile?.phone;
        if (phone) {
          try {
            await sendSms(phone, `سبزفراز\nبیعانه سفارش جمعی ${bulkRequest.request_number} با موفقیت پرداخت شد.`);
          } catch (e) {
            console.error(e);
          }
        }
      } else {
        await createNotification(
          bulkRequest.user_id,
          "واریز مانده تأیید شد ✅",
          `واریز مانده‌ی سفارش جمعی ${bulkRequest.request_number} با موفقیت انجام شد.`
        );
        await notifyAllAdmins(
          "پرداخت آنلاین مانده‌ی سفارش جمعی موفق بود",
          `مانده‌ی سفارش جمعی ${bulkRequest.request_number} از طریق درگاه پرداخت شد. کد پیگیری: ${refNum}`
        );
      }

      return go("success");
    }

    await settleBulkPayment(admin, requestId, {
      kind,
      from: ["PENDING"],
      to: "FAILED",
      method: "ONLINE",
      refNum,
      error: `verify failed: ${JSON.stringify(result.raw ?? null)}`,
    });
    return go("failed");
  } catch (e) {
    // وضعیت تغییر نمی‌کند؛ فقط خطا ثبت می‌شود تا ادمین بررسی کند
    await settleBulkPayment(admin, requestId, {
      kind,
      from: ["PENDING"],
      to: null,
      method: "ONLINE",
      refNum,
      error: `exception: ${e instanceof Error ? e.message : String(e)}`,
    });
    return go("error");
  }
}