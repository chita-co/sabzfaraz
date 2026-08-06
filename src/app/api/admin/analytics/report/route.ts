import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

async function requireAdmin() {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return null;
  const { data: profile } = await authClient.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "ADMIN") return null;
  return user;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

interface SessionRow {
  id: string;
  visitor_id: string;
  started_at: string;
  ended_at: string;
  landing_page: string;
  exit_page: string;
  traffic_source: string;
  device_type: string;
  browser: string;
  os: string;
  page_count: number;
  is_converted: boolean;
}

export async function GET(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const sourceFilter = searchParams.get("source") || "";
  const deviceFilter = searchParams.get("device") || "";
  const convertedFilter = searchParams.get("converted") || "";

  const now = new Date();
  const from = fromParam ? new Date(fromParam) : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const to = toParam ? new Date(new Date(toParam).getTime() + 24 * 60 * 60 * 1000 - 1) : now;

  const admin = createAdminClient();

  const todayStart = startOfDay(now);
  const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
  const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(todayStart.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [todayCount, yesterdayCount, weekCount, monthCount] = await Promise.all([
    admin.from("analytics_sessions").select("*", { count: "exact", head: true }).eq("is_bot", false).gte("started_at", todayStart.toISOString()),
    admin.from("analytics_sessions").select("*", { count: "exact", head: true }).eq("is_bot", false).gte("started_at", yesterdayStart.toISOString()).lt("started_at", todayStart.toISOString()),
    admin.from("analytics_sessions").select("*", { count: "exact", head: true }).eq("is_bot", false).gte("started_at", weekStart.toISOString()),
    admin.from("analytics_sessions").select("*", { count: "exact", head: true }).eq("is_bot", false).gte("started_at", monthStart.toISOString()),
  ]);

  let query = admin
    .from("analytics_sessions")
    .select("id, visitor_id, started_at, ended_at, landing_page, exit_page, traffic_source, device_type, browser, os, page_count, is_converted")
    .eq("is_bot", false)
    .gte("started_at", from.toISOString())
    .lte("started_at", to.toISOString());

  if (sourceFilter) query = query.eq("traffic_source", sourceFilter);
  if (deviceFilter) query = query.eq("device_type", deviceFilter);
  if (convertedFilter === "yes") query = query.eq("is_converted", true);
  else if (convertedFilter === "no") query = query.eq("is_converted", false);

  const { data } = await query;
  const rows = (data ?? []) as SessionRow[];

  const bounceCount = rows.filter((s) => (s.page_count ?? 0) <= 1).length;
  const bounceRate = rows.length > 0 ? (bounceCount / rows.length) * 100 : 0;
  const totalDuration = rows.reduce((sum, s) => sum + Math.max(0, (new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 1000), 0);
  const avgSessionSeconds = rows.length > 0 ? Math.round(totalDuration / rows.length) : 0;
  const convertedCount = rows.filter((s) => s.is_converted).length;
  const conversionRate = rows.length > 0 ? (convertedCount / rows.length) * 100 : 0;
  const uniqueVisitors = new Set(rows.map((s) => s.visitor_id)).size;

  const rangeDays = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
  const byHour = rangeDays <= 2;
  const bucketMap = new Map<string, { sessions: number; visitors: Set<string> }>();

  for (const s of rows) {
    const d = new Date(s.started_at);
    const key = byHour
      ? `${d.toLocaleDateString("fa-IR")} ${d.getHours().toString().padStart(2, "0")}:00`
      : d.toLocaleDateString("fa-IR");
    if (!bucketMap.has(key)) bucketMap.set(key, { sessions: 0, visitors: new Set() });
    const bucket = bucketMap.get(key)!;
    bucket.sessions++;
    bucket.visitors.add(s.visitor_id);
  }
  const chart = Array.from(bucketMap.entries()).map(([label, v]) => ({ label, sessions: v.sessions, uniqueVisitors: v.visitors.size }));

  const landingMap = new Map<string, { visits: number; sameExit: number }>();
  for (const s of rows) {
    const key = s.landing_page || "—";
    if (!landingMap.has(key)) landingMap.set(key, { visits: 0, sameExit: 0 });
    const entry = landingMap.get(key)!;
    entry.visits++;
    if (s.exit_page === s.landing_page) entry.sameExit++;
  }
  const landingPages = Array.from(landingMap.entries())
    .map(([page, v]) => ({ page, visits: v.visits, exitRate: v.visits > 0 ? Math.round((v.sameExit / v.visits) * 100) : 0 }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 15);

  function bucketize(field: "traffic_source" | "browser" | "os" | "device_type") {
    const map = new Map<string, number>();
    for (const s of rows) {
      const key = (s[field] as string) || "نامشخص";
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    const total = rows.length || 1;
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count, percent: Math.round((count / total) * 100) }))
      .sort((a, b) => b.count - a.count);
  }

  const recentSessions = [...rows]
    .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
    .slice(0, 50)
    .map((s) => ({
      id: s.id,
      startedAt: s.started_at,
      landingPage: s.landing_page,
      exitPage: s.exit_page,
      device: s.device_type,
      browser: s.browser,
      os: s.os,
      source: s.traffic_source,
      pageCount: s.page_count,
      durationSeconds: Math.max(0, Math.round((new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 1000)),
      converted: s.is_converted,
    }));

  return NextResponse.json({
    cards: {
      today: todayCount.count ?? 0,
      yesterday: yesterdayCount.count ?? 0,
      thisWeek: weekCount.count ?? 0,
      thisMonth: monthCount.count ?? 0,
      uniqueVisitors,
      bounceRate: Math.round(bounceRate),
      avgSessionSeconds,
      conversionRate: Math.round(conversionRate * 10) / 10,
    },
    chart,
    landingPages,
    referrers: bucketize("traffic_source"),
    browsers: bucketize("browser"),
    os: bucketize("os"),
    devices: bucketize("device_type"),
    recentSessions,
    totalSessions: rows.length,
  });
}