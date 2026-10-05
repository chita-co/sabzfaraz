import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const NEW_DOMAIN = "sabzfaraz.ir";

// لیست تمام دامنه‌های قدیمی که باید به دامنه اصلی ریدایرکت بشن
const OLD_DOMAINS = new Set([
  "sabzfaraz.vercel.app",
  "sabzfaraz-five.vercel.app",
  "price.sabzfaraz.ir",
  "sabzfaraz.apps.teh11.abrhapaas.com",
]);

const ALLOWED_OLD_DOMAIN_PATHS = new Set(["/", "/badge-company", "/badge-personal", "/enamad-verify"]);

const SKIP_AUTH_CHECK_PATHS = new Set([
  "/badge-company",
  "/badge-personal",
  "/enamad-verify",
]);

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;
  const isOldDomain = OLD_DOMAINS.has(host);

  // ریدایرکت از هر دامنه‌ی قدیمی به دامنه اصلی (به جز مسیرهای اینماد)
  if (isOldDomain && !ALLOWED_OLD_DOMAIN_PATHS.has(pathname)) {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    url.host = NEW_DOMAIN;
    return NextResponse.redirect(url, 301);
  }

  let response = NextResponse.next({ request });

  // فقط برای صفحات غیر-اینماد، چک session انجام بده
  const needsAuthCheck = !SKIP_AUTH_CHECK_PATHS.has(pathname);
  // فقط اگه کوکی session وجود داشته باشه، به Supabase fetch بزن
  const hasSessionCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));

  if (needsAuthCheck && hasSessionCookie) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    try {
      await supabase.auth.getUser();
    } catch {
      console.warn("[middleware] Supabase auth check failed (network)");
    }
  }
// X-Robots-Tag برای مسیرهای اینماد روی دامنه‌های قدیمی
  if (isOldDomain && ALLOWED_OLD_DOMAIN_PATHS.has(pathname)) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  // کوکی ترب (دست‌نخورده)
  const torobClid = request.nextUrl.searchParams.get("torob_clid");
  if (torobClid) {
    response.cookies.set("torob_clid", torobClid, {
      maxAge: 60 * 60 * 168,
      path: "/",
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|blog|price-ticker|calendar|api/payment/callback|api/auctions/winner-payment/callback|api/reverse-auctions/payment/callback|api/bulk-order/payment/callback|api/wallet/topup/callback|api/torob/v1/orders|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};