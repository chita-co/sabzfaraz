import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  const { data: profile } = await authClient.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "ADMIN") return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });

  const admin = createAdminClient();
  const [{ data: session }, { data: pageviews }, { data: conversions }] = await Promise.all([
    admin.from("analytics_sessions").select("*").eq("id", id).single(),
    admin.from("analytics_pageviews").select("*").eq("session_id", id).order("viewed_at", { ascending: true }),
    admin.from("analytics_conversions").select("*").eq("session_id", id),
  ]);

  return NextResponse.json({ session, pageviews: pageviews ?? [], conversions: conversions ?? [] });
}