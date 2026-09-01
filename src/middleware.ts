import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const OLD_DOMAIN = "sabzfaraz.vercel.app";
const NEW_DOMAIN = "sabzfaraz.ir";
const ALLOWED_OLD_DOMAIN_PATHS = new Set(["/", "/badge-company"]);

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;

  if (host === OLD_DOMAIN && !ALLOWED_OLD_DOMAIN_PATHS.has(pathname)) {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    url.host = NEW_DOMAIN;
    return NextResponse.redirect(url, 301);
  }

  let response = NextResponse.next({ request });

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
  } catch (error) {
    console.error("Auth error in middleware:", error);
  }

  if (host === OLD_DOMAIN && ALLOWED_OLD_DOMAIN_PATHS.has(pathname)) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api/payment/callback|api/auctions/winner-payment/callback|api/reverse-auctions/payment/callback|api/bulk-order/payment/callback|api/wallet/topup/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};