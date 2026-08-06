import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  }
  const admin = createAdminClient();
  const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString();
  await admin.from("analytics_pageviews").delete().lt("viewed_at", sixMonthsAgo);
  await admin.from("analytics_sessions").delete().lt("started_at", sixMonthsAgo);
  return NextResponse.json({ status: "ok" });
}