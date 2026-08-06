"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const VISITOR_ID_KEY = "sf_visitor_id";
const SESSION_KEY_KEY = "sf_session_key";
const SESSION_LAST_ACTIVITY_KEY = "sf_session_last_activity";

function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getOrCreateVisitorId(): string {
  let id = localStorage.getItem(VISITOR_ID_KEY);
  if (!id) {
    id = generateId();
    localStorage.setItem(VISITOR_ID_KEY, id);
  }
  return id;
}

function getOrCreateSessionKey(): string {
  const now = Date.now();
  const last = Number(localStorage.getItem(SESSION_LAST_ACTIVITY_KEY) || 0);
  let key = localStorage.getItem(SESSION_KEY_KEY);

  if (!key || now - last > SESSION_TIMEOUT_MS) {
    key = generateId();
    localStorage.setItem(SESSION_KEY_KEY, key);
  }
  localStorage.setItem(SESSION_LAST_ACTIVITY_KEY, String(now));

  // آینه‌ی کوکی — چون سرور (مثلاً کال‌بک پرداخت) فقط به کوکی دسترسی دارد، نه localStorage
  document.cookie = `sf_analytics_session=${key}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;

  return key;
}

const CLIENT_BOT_PATTERNS = [
  /bot/i, /crawl/i, /spider/i, /headlesschrome/i, /phantomjs/i,
  /lighthouse/i, /pingdom/i, /uptimerobot/i, /python-requests/i, /curl\//i, /wget\//i,
];

function isLikelyBot(): boolean {
  return CLIENT_BOT_PATTERNS.some((re) => re.test(navigator.userAgent));
}

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // eslint-disable-next-line react-hooks/purity
  const pageStartRef = useRef<number>(Date.now());
  const currentPageviewIdRef = useRef<string | null>(null);
  const isFirstRunRef = useRef(true);
  const disabledRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isLikelyBot()) { disabledRef.current = true; return; }

    const qs = searchParams.toString();
    const url = `${pathname}${qs ? `?${qs}` : ""}`;
    const fullUrl = window.location.origin + url;

    async function send() {
      const now = Date.now();
      const prevDuration = isFirstRunRef.current ? null : Math.round((now - pageStartRef.current) / 1000);
      const prevPageviewId = currentPageviewIdRef.current;

      const payload = {
        visitorId: getOrCreateVisitorId(),
        sessionKey: getOrCreateSessionKey(),
        pageUrl: fullUrl,
        pageTitle: document.title,
        referrer: isFirstRunRef.current ? document.referrer : "",
        screenSize: `${window.screen.width}x${window.screen.height}`,
        utmSource: searchParams.get("utm_source"),
        utmMedium: searchParams.get("utm_medium"),
        utmCampaign: searchParams.get("utm_campaign"),
        utmTerm: searchParams.get("utm_term"),
        utmContent: searchParams.get("utm_content"),
        prevPageviewId,
        prevDurationSeconds: prevDuration,
      };

      try {
        const res = await fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          keepalive: true,
        });
        const data = await res.json();
        if (data?.pageviewId) currentPageviewIdRef.current = data.pageviewId;
      } catch {
        // شکست بی‌صدا؛ نباید هیچ‌وقت تجربه‌ی کاربر را مختل کند
      }

      pageStartRef.current = now;
      isFirstRunRef.current = false;
    }

    send();
  }, [pathname, searchParams]);

  useEffect(() => {
    function flushOnLeave() {
      if (disabledRef.current || !currentPageviewIdRef.current) return;
      const duration = Math.round((Date.now() - pageStartRef.current) / 1000);
      const payload = JSON.stringify({ pageviewId: currentPageviewIdRef.current, durationSeconds: duration });
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon?.("/api/track/ping", blob);
    }

    function handleVisibility() {
      if (document.visibilityState === "hidden") flushOnLeave();
    }

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", flushOnLeave);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", flushOnLeave);
    };
  }, []);

  return null;
}