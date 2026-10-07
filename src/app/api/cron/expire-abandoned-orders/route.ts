import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { refundRedeemedPoints } from "@/lib/loyalty/ledger";
import { refundDiscountCode } from "@/lib/discountCode";
import { refundWalletForOrder } from "@/lib/wallet/refundOrderWallet";

// سفارش‌های درگاهیِ پرداخت‌نشده که بیش از این مدت از ساختشان گذشته آزاد می‌شوند.
// توکن SEP حدود ۲۰ دقیقه اعتبار دارد؛ حداقل ۶۰ دقیقه اعمال می‌شود تا پرداخت در حال انجام لغو نشود.
const ABANDONED_AFTER_MINUTES = Math.max(60, Number(process.env.ABANDONED_ORDER_MINUTES) || 120);
const BATCH_SIZE = 50;

export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  }

  const admin = createAdminClient();
  const cutoff = new Date(Date.now() - ABANDONED_AFTER_MINUTES * 60_000).toISOString();

  const { data: candidates, error } = await admin
    .from("orders")
    .select("id, order_number")
    .eq("status", "PENDING")
    .eq("payment_status", "PENDING")
    .not("sep_token", "is", null)
    .is("sep_ref_num", null)
    .is("related_auction_id", null)
    .lt("created_at", cutoff)
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    console.error("expire-abandoned-orders: خطا در خواندن سفارش‌ها:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let released = 0;
  for (const order of candidates ?? []) {
    // ادعای اتمیک: فقط اگر هنوز PENDING باشد. اگر callback همزمان سفارش را PAID کرده باشد، هیچ ردیفی تغییر نمی‌کند.
    const { data: claimed } = await admin
      .from("orders")
      .update({ payment_status: "FAILED", status: "CANCELLED" })
      .eq("id", order.id)
      .eq("status", "PENDING")
      .eq("payment_status", "PENDING")
      .select("id");

    if (!claimed || claimed.length === 0) continue;

    try { await refundRedeemedPoints(order.id); } catch (e) { console.error("خطا در بازگشت امتیاز:", e); }
    await refundDiscountCode(order.id);
    await refundWalletForOrder(order.id);

    console.log("expire-abandoned-orders: سفارش آزاد شد", order.order_number, order.id);
    released++;
  }

  return NextResponse.json({ status: "ok", checked: candidates?.length ?? 0, released });
}