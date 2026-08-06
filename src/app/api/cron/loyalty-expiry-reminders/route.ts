import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getLoyaltySettings } from "@/lib/loyalty/settings";
import { createNotification } from "@/lib/notifications";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  }

  const admin = createAdminClient();
  const settings = await getLoyaltySettings();
  const now = new Date();
  const windowEnd = new Date(now.getTime() + settings.reminderDaysBeforeExpiry * 24 * 60 * 60 * 1000);

  const { data: batches } = await admin
    .from("loyalty_transactions").select("id, user_id, points_remaining, expires_at")
    .eq("type", "EARNED").gt("points_remaining", 0).eq("reminder_sent", false)
    .gte("expires_at", now.toISOString()).lte("expires_at", windowEnd.toISOString());

  for (const batch of batches ?? []) {
    const daysLeft = Math.ceil((new Date(batch.expires_at).getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    await createNotification(
      batch.user_id, "امتیازهایت داره منقضی می‌شه!",
      `فقط ${daysLeft.toLocaleString("fa-IR")} روز تا سوختن ${batch.points_remaining.toLocaleString("fa-IR")} امتیازت مونده. یه خرید کن و اعتبارتو ذخیره کن.`
    );
    await admin.from("loyalty_transactions").update({ reminder_sent: true }).eq("id", batch.id);
  }

  return NextResponse.json({ status: "ok", remindersSent: batches?.length ?? 0 });
}