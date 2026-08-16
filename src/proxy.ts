// src/proxy.ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const OLD_DOMAIN = "sabzfaraz.vercel.app";
const NEW_DOMAIN = "sabzfaraz.ir";
const EXEMPT_PATH = "/enamad-verify"; // فقط همین مسیر از ریدایرکت مستثناست

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") || "";

  // ریدایرکت دائمی دامنه‌ی قدیمی به دامنه‌ی جدید — به‌جز مسیر تأیید اینماد
  if (host === OLD_DOMAIN && request.nextUrl.pathname !== EXEMPT_PATH) {
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
    // خطای fetch (قطعی شبکه یا مشکل Supabase) را نادیده می‌گیریم
    // تا صفحات عمومی همچنان بدون خطا لود شوند.
    console.error("Auth error in proxy:", error);
  }

  return response;
}

export const config = {
  matcher: [
    // مسیرهای API، فایل‌های استاتیک، sitemap و robots را نادیده می‌گیرد
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|_rsc|product-detail|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};