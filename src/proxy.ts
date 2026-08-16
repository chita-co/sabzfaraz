// src/proxy.ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const OLD_DOMAIN = "sabzfaraz.vercel.app";
const NEW_DOMAIN = "sabzfaraz.ir";

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;

  // ریدایرکت دامنه‌ی قدیمی به دامنه‌ی جدید — به‌جز ریشه (/)
  if (host === OLD_DOMAIN && pathname !== "/") {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    url.host = NEW_DOMAIN;
    return NextResponse.redirect(url, 301);
  }

  // اگر ریشه‌ی دامنه‌ی قدیمی بود، noindex header اضافه کن
  let response = NextResponse.next({ request });
  if (host === OLD_DOMAIN && pathname === "/") {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

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
    console.error("Auth error in proxy:", error);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|_rsc|product-detail|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};