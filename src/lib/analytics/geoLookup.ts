export interface GeoInfo {
  countryCode: string | null;
  countryName: string | null;
  city: string | null;
}

const PRIVATE_IP_PREFIXES = ["127.", "192.168.", "10.", "0.0.0.0", "::1"];

export async function lookupIpCountry(ip: string): Promise<GeoInfo> {
  if (!ip || PRIVATE_IP_PREFIXES.some((p) => ip.startsWith(p))) {
    return { countryCode: null, countryName: null, city: null };
  }
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`, {
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return { countryCode: null, countryName: null, city: null };
    const data = await res.json();
    if (data.error) return { countryCode: null, countryName: null, city: null };
    return {
      countryCode: data.country_code ?? null,
      countryName: data.country_name_fa ?? data.country_name ?? null,
      city: data.city ?? null,
    };
  } catch {
    return { countryCode: null, countryName: null, city: null };
  }
}

export function countryCodeToFlagEmoji(countryCode: string | null | undefined): string {
  if (!countryCode || countryCode.length !== 2) return "🏳️";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((c) => 127397 + c.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}