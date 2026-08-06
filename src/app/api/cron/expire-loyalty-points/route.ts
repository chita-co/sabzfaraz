import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: expiredBatches } = await admin
    .from("loyalty_transactions").select("id, user_id, points_remaining")
    .eq("type", "EARNED").gt("points_remaining", 0).lt("expires_at", now);

  for (const batch of expiredBatches ?? []) {
    const { data: profile } = await admin.from("profiles").select("loyalty_points_balance").eq("id", batch.user_id).single();
    const newBalance = Math.max(0, (profile?.loyalty_points_balance ?? 0) - batch.points_remaining);

    await admin.from("profiles").update({ loyalty_points_balance: newBalance }).eq("id", batch.user_id);
    await admin.from("loyalty_transactions").update({ points_remaining: 0 }).eq("id", batch.id);
    await admin.from("loyalty_transactions").insert({
      user_id: batch.user_id, type: "EXPIRED", points: -batch.points_remaining,
      points_remaining: 0, balance_after: newBalance, description: "انقضای امتیاز پس از پایان مهلت استفاده",
    });
    await createNotification(batch.user_id, "امتیازهایت منقضی شد", `${batch.points_remaining.toLocaleString("fa-IR")} امتیاز از حسابت به دلیل پایان مهلت استفاده باطل شد.`);
  }

  return NextResponse.json({ status: "ok", expiredBatches: expiredBatches?.length ?? 0 });
}