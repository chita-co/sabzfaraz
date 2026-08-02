// src/proxy.ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
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