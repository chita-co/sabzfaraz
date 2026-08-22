import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { parseUserAgent } from "@/lib/analytics/parseUserAgent";
import { isBotUserAgent } from "@/lib/analytics/botDetection";
import { classifyTraffic } from "@/lib/analytics/trafficSource";
import { hashIp, getClientIp } from "@/lib/analytics/hashIp";
import { getCountryNameFa } from "@/lib/analytics/geoLookup";
import { extractSearchInfo } from "@/lib/analytics/searchKeywords";

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

    // بازدید ادمین دیگر نادیده گرفته نمی‌شود — با پرچم is_admin_visit ثبت می‌شود
    // تا هم در جدول با برچسب مشخص دیده شود، هم بتوان آن را از آمار اصلی فروش کنار گذاشت
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();
    let isAdminVisit = false;
    if (user) {
      const { data: profile } = await authClient.from("profiles").select("role").eq("id", user.id).single();
      isAdminVisit = profile?.role === "ADMIN";
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
      const updatePayload: Record<string, unknown> = {
        ended_at: new Date().toISOString(),
        exit_page: pageUrl,
        page_count: (existingSession.page_count ?? 0) + 1,
      };
      // فقط وقتی کاربر لاگین است user_id را ثبت/به‌روزرسانی کن؛ هرگز با null بازنویسی نکن
      if (user?.id) updatePayload.user_id = user.id;
      // اگر کاربر وسط همین نشست وارد حساب ادمین شد، کل نشست علامت‌گذاری شود
      if (isAdminVisit) updatePayload.is_admin_visit = true;

      await admin.from("analytics_sessions").update(updatePayload).eq("id", sessionId);
    } else {
      const { source, domain } = classifyTraffic(referrer || null, pageUrl, utmSource || null, utmMedium || null);
      const { keywords: searchKeywords, engine: searchEngine } = extractSearchInfo(referrer || null);
      // موقعیت جغرافیایی رایگان و آماده‌ی خودِ Vercel — بدون نیاز به هیچ فراخوانی بیرونی
      let countryCode = request.headers.get("x-vercel-ip-country");
      const countryCityHeader = request.headers.get("x-vercel-ip-city");
      let countryName = getCountryNameFa(countryCode);
      const city = countryCityHeader ? decodeURIComponent(countryCityHeader) : null;

      // برای کاربران واردشده، چون شماره موبایل ایرانی هنگام ثبت‌نام تأیید شده،
      // کشور را «ایران» در نظر می‌گیریم — چون پایگاه‌داده‌ی موقعیت‌مکانی Vercel/MaxMind
      // گاهی بازه‌های آی‌پی ایرانی را به‌اشتباه به کشورهای همسایه (رایج‌ترین: آذربایجان) نسبت می‌دهد
      if (user?.id) {
        countryCode = "IR";
        countryName = "ایران";
      }

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
          is_admin_visit: isAdminVisit,
          user_id: user?.id ?? null,
          page_count: 1,
          country_code: countryCode,
          country_name: countryName,
          city,
          search_keywords: searchKeywords,
          search_engine: searchEngine,
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