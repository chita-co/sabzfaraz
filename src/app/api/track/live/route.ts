import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET() {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  const { data: profile } = await authClient.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "ADMIN") return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });

  const admin = createAdminClient();
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const { data } = await admin
    .from("analytics_sessions")
    .select("id, exit_page, device_type, browser, traffic_source, ended_at")
    .gte("ended_at", fiveMinAgo)
    .eq("is_bot", false)
    .order("ended_at", { ascending: false })
    .limit(50);

  return NextResponse.json({ sessions: data ?? [] });
}