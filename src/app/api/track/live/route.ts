import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  const { data: profile } = await authClient.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "ADMIN") return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const includeAdmin = searchParams.get("includeAdmin") === "true";

  const admin = createAdminClient();
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  let query = admin
    .from("analytics_sessions")
    .select("id, exit_page, device_type, browser, traffic_source, ended_at, user_id, is_admin_visit, country_code, country_name, profile:profiles(full_name)")
    .gte("ended_at", fiveMinAgo)
    .eq("is_bot", false)
    .order("ended_at", { ascending: false })
    .limit(50);

  if (!includeAdmin) query = query.eq("is_admin_visit", false);

  const { data } = await query;

  return NextResponse.json({ sessions: data ?? [] });
}