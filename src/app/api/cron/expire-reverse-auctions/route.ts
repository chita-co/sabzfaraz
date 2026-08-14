import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications";

export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();
  let endedUnsold = 0;
  let reopened = 0;

  const { data: expiredActive } = await admin
    .from("reverse_auctions").select("id").eq("status", "ACTIVE").not("ends_at", "is", null).lte("ends_at", now);
  for (const a of expiredActive ?? []) {
    await admin.from("reverse_auctions").update({ status: "ENDED_UNSOLD" }).eq("id", a.id);
    endedUnsold++;
  }

  const { data: expiredPayments } = await admin
    .from("reverse_auctions").select("id, title, winner_user_id").eq("status", "SOLD").eq("payment_status", "PENDING").lt("payment_deadline", now);
  for (const a of expiredPayments ?? []) {
    if (a.winner_user_id) {
      await createNotification(a.winner_user_id, "مهلت پرداخت به پایان رسید", `مهلت پرداخت خرید «${a.title}» به پایان رسید و این کالا دوباره برای فروش قرار گرفت.`);
    }
    await admin.rpc("reopen_reverse_auction", { p_id: a.id });
    reopened++;
  }

  return NextResponse.json({ status: "ok", endedUnsold, reopened });
}