// src/app/api/calendar/weather/route.ts
//
// آب‌وهوای بالای تقویم — از Open-Meteo (رایگان، بدون کلید، مستندات رسمی
// پایدار). چون آب‌وهوا نیازی به تازگی ثانیه‌به‌ثانیه ندارد، از کش استاندارد
// fetch خودِ Next.js (نه Supabase) با تازه‌سازی هر ۳۰ دقیقه استفاده شده —
// یعنی نه دیتابیس درگیر می‌شود و نه هیچ Cron Job‌ی لازم است.

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const WEATHER_DESCRIPTIONS: Record<number, string> = {
  0: "آسمان صاف", 1: "کمی ابری", 2: "نیمه‌ابری", 3: "ابری",
  45: "مه", 48: "مه یخ‌زده",
  51: "نم‌نم باران سبک", 53: "نم‌نم باران", 55: "نم‌نم باران شدید",
  61: "باران سبک", 63: "باران", 65: "باران شدید",
  71: "برف سبک", 73: "برف", 75: "برف شدید",
  80: "رگبار سبک", 81: "رگبار", 82: "رگبار شدید",
  95: "رعدوبرق", 96: "رعدوبرق با تگرگ",
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat") ?? "35.6892"; // تهران به‌صورت پیش‌فرض
  const lon = searchParams.get("lon") ?? "51.3890";
  const city = searchParams.get("city") ?? "تهران";

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`,
      { next: { revalidate: 1800 } }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const cw = json.current_weather;
    if (!cw) throw new Error("پاسخ آب‌وهوا نامعتبر بود");

    return NextResponse.json({
      city,
      temperature: Math.round(cw.temperature),
      windSpeed: cw.windspeed,
      code: cw.weathercode,
      description: WEATHER_DESCRIPTIONS[cw.weathercode] ?? "نامشخص",
      isDay: cw.is_day === 1,
    });
  } catch {
    return NextResponse.json({ city, error: "دریافت آب‌وهوا موقتاً ناموفق بود" }, { status: 200 });
  }
}
