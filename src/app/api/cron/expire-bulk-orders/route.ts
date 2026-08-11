import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications";

export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  }
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: expired } = await admin
    .from("bulk_order_requests")
    .select("id, user_id, request_number")
    .eq("status", "SUPPLY_POSSIBLE")
    .lt("deposit_expires_at", now);

  for (const r of expired ?? []) {
    await admin.from("bulk_order_requests").update({ status: "CLOSED_UNPAID", updated_at: now }).eq("id", r.id);
    await createNotification(r.user_id, "سفارش جمعی شما بسته شد", `مهلت پرداخت بیعانه‌ی سفارش ${r.request_number} به پایان رسید و این درخواست بسته شد.`);
  }

  return NextResponse.json({ status: "ok", closed: expired?.length ?? 0 });
}