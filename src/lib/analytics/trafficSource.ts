export interface TrafficClassification {
  source: string;
  domain: string | null;
}

const SEARCH_ENGINES = ["google.", "bing.", "yahoo.", "duckduckgo.", "yandex.", "baidu."];
const SOCIAL_DOMAINS = ["instagram.com", "telegram.org", "t.me", "twitter.com", "x.com", "facebook.com", "linkedin.com", "wa.me", "whatsapp.com", "pinterest.com"];
const AI_DOMAINS = ["chat.openai.com", "bard.google.com", "gemini.google.com", "perplexity.ai", "claude.ai", "copilot.microsoft.com", "you.com"];

export function classifyTraffic(
  referrer: string | null,
  currentUrl: string,
  utmSource: string | null,
  utmMedium: string | null
): TrafficClassification {
  let ownHost = "";
  try { ownHost = new URL(currentUrl).host; } catch {}

  let refHost: string | null = null;
  try { refHost = referrer ? new URL(referrer).host : null; } catch {}

  let gclid = false;
  try { gclid = new URL(currentUrl).searchParams.has("gclid"); } catch {}

  if (utmSource) {
    const medium = (utmMedium || "").toLowerCase();
    if (["cpc", "ppc", "paid"].includes(medium)) return { source: "Paid Campaign", domain: refHost };
    if (medium === "social") return { source: "Social (Campaign)", domain: refHost };
    if (medium === "email") return { source: "Email Campaign", domain: refHost };
    return { source: `Campaign: ${utmSource}`, domain: refHost };
  }

  if (gclid) return { source: "Paid Search (Google Ads)", domain: refHost };
  if (!refHost || refHost === ownHost) return { source: "Direct", domain: null };
  if (refHost.includes("torob.com")) return { source: "Torob", domain: refHost };
  if (AI_DOMAINS.some((d) => refHost!.includes(d))) return { source: "AI Platform", domain: refHost };
  if (SOCIAL_DOMAINS.some((d) => refHost!.includes(d))) return { source: "Social", domain: refHost };
  if (SEARCH_ENGINES.some((d) => refHost!.includes(d))) return { source: "Organic Search", domain: refHost };

  return { source: "Referral", domain: refHost };
}