// src/app/api/price-ticker/route.ts
//
// این مسیر عمومی (بدون نیاز به لاگین) و کاملاً مستقل از بخش‌های دیگر سایت است.
// فقط از جدول‌های جدید price_ticker_cache / price_ticker_history می‌خواند و
// می‌نویسد و هیچ Query‌ای روی جدول‌های موجود پروژه اجرا نمی‌کند.
//
// عمداً به هیچ CRON_SECRET نیازی ندارد و در vercel.json ثبت نمی‌شود — طبق
// درخواست پروژه، از کرون‌جاب استفاده نشده تا با کرون‌جاب‌های فعلی (ربات‌ها و
// ...) تداخلی پیش نیاید. تازه‌سازی به‌صورت «lazy» و بر پایه‌ی ترافیک واقعی
// کاربران انجام می‌شود (به src/lib/priceTicker/cache.ts نگاه کنید).

import { NextResponse } from "next/server";
import { getPriceSnapshot } from "@/lib/priceTicker/cache";

export const revalidate = 0;

export const runtime = "nodejs";
// این مقدار فقط برای فایل‌های استاتیک/ISR کاربرد دارد؛ چون خودمان کش را در
// Supabase مدیریت می‌کنیم، اینجا همیشه dynamic اجرا می‌شود.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snapshot = await getPriceSnapshot();
    return NextResponse.json(snapshot, {
      headers: {
        // کش کوتاه در لبه‌ی Vercel (CDN) هم کمک می‌کند فشار درخواست‌های
        // هم‌زمان زیاد به تابع سرورلس نرسد؛ منبع حقیقت همچنان Supabase است.
        "Cache-Control": "public, max-age=5, s-maxage=15, stale-while-revalidate=30",
      },
    });
  } catch {
    return NextResponse.json(
      {
        currency: [],
        gold: [],
        crypto: [],
        updatedAt: new Date().toISOString(),
        stale: true,
        error: "در حال تلاش برای دریافت قیمت‌ها...",
      },
      { status: 200 }
    );
  }
}
