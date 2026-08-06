import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const text = await request.text();
    const { pageviewId, durationSeconds } = JSON.parse(text);
    if (!pageviewId || typeof durationSeconds !== "number") {
      return NextResponse.json({ status: "invalid" }, { status: 400 });
    }
    const admin = createAdminClient();
    await admin.from("analytics_pageviews").update({ time_on_page_seconds: durationSeconds }).eq("id", pageviewId);
    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}