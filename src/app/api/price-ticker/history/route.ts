// src/app/api/price-ticker/history/route.ts
//
// تاریخچه‌ی قیمت یک نماد برای رسم نمودار. مثال:
// /api/price-ticker/history?category=currency&symbol=USD&hours=24

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PriceCategory } from "@/types/priceTicker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_CATEGORIES: PriceCategory[] = ["currency", "gold", "crypto"];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") as PriceCategory | null;
  const symbol = searchParams.get("symbol");
  const hours = Math.min(Math.max(Number(searchParams.get("hours") ?? 24), 1), 24 * 8);

  if (!category || !VALID_CATEGORIES.includes(category) || !symbol) {
    return NextResponse.json({ error: "پارامترهای category و symbol الزامی هستند" }, { status: 400 });
  }

  const admin = createAdminClient();
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const { data, error } = await admin
    .from("price_ticker_history")
    .select("price, recorded_at")
    .eq("category", category)
    .eq("symbol", symbol)
    .gte("recorded_at", since)
    .order("recorded_at", { ascending: true })
    .limit(2000);

  if (error) {
    return NextResponse.json({ points: [] }, { status: 200 });
  }

  const points = (data ?? []).map((row) => ({ t: row.recorded_at as string, price: Number(row.price) }));

  return NextResponse.json(
    { points },
    { headers: { "Cache-Control": "public, max-age=15, s-maxage=30, stale-while-revalidate=60" } }
  );
}
