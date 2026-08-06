import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { parseUserAgent } from "@/lib/analytics/parseUserAgent";
import { isBotUserAgent } from "@/lib/analytics/botDetection";
import { classifyTraffic } from "@/lib/analytics/trafficSource";
import { hashIp, getClientIp } from "@/lib/analytics/hashIp";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      visitorId, sessionKey, pageUrl, pageTitle, referrer, screenSize,
      utmSource, utmMedium, utmCampaign, utmTerm, utmContent,
      prevPageviewId, prevDurationSeconds,
    } = body || {};

    if (!visitorId || !sessionKey || !pageUrl) {
      return NextResponse.json({ status: "invalid" }, { status: 400 });
    }

    const userAgent = request.headers.get("user-agent") || "";
    if (isBotUserAgent(userAgent)) {
      return NextResponse.json({ status: "ignored-bot" });
    }

    // بازدید ادمین شمرده نمی‌شود (تشخیص خودکار از روی نقش کاربر لاگین‌شده)
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (user) {
      const { data: profile } = await authClient.from("profiles").select("role").eq("id", user.id).single();
      if (profile?.role === "ADMIN") {
        return NextResponse.json({ status: "ignored-admin" });
      }
    }

    const admin = createAdminClient();
    const ip = getClientIp(request.headers);
    const ipHash = hashIp(ip);
    const { deviceType, browser, browserVersion, os } = parseUserAgent(userAgent);

    if (prevPageviewId && typeof prevDurationSeconds === "number" && prevDurationSeconds >= 0) {
      await admin.from("analytics_pageviews").update({ time_on_page_seconds: prevDurationSeconds }).eq("id", prevPageviewId);
    }

    const { data: existingSession } = await admin
      .from("analytics_sessions")
      .select("id, page_count")
      .eq("session_key", sessionKey)
      .maybeSingle();

    let sessionId: string;

    if (existingSession) {
      sessionId = existingSession.id;
      await admin
        .from("analytics_sessions")
        .update({
          ended_at: new Date().toISOString(),
          exit_page: pageUrl,
          page_count: (existingSession.page_count ?? 0) + 1,
          user_id: user?.id ?? null,
        })
        .eq("id", sessionId);
    } else {
      const { source, domain } = classifyTraffic(referrer || null, pageUrl, utmSource || null, utmMedium || null);
      const { data: created, error } = await admin
        .from("analytics_sessions")
        .insert({
          visitor_id: visitorId,
          session_key: sessionKey,
          ip_hash: ipHash,
          user_agent: userAgent,
          device_type: deviceType,
          browser,
          browser_version: browserVersion,
          os,
          screen_size: screenSize || null,
          landing_page: pageUrl,
          exit_page: pageUrl,
          referrer: referrer || null,
          referrer_domain: domain,
          traffic_source: source,
          utm_source: utmSource || null,
          utm_medium: utmMedium || null,
          utm_campaign: utmCampaign || null,
          utm_term: utmTerm || null,
          utm_content: utmContent || null,
          is_bot: false,
          user_id: user?.id ?? null,
          page_count: 1,
        })
        .select("id")
        .single();

      if (error || !created) return NextResponse.json({ status: "error" }, { status: 500 });
      sessionId = created.id;
    }

    const { data: pageview } = await admin
      .from("analytics_pageviews")
      .insert({ session_id: sessionId, page_url: pageUrl, page_title: pageTitle || null })
      .select("id")
      .single();

    return NextResponse.json({ status: "ok", sessionId, pageviewId: pageview?.id ?? null });
  } catch {
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}