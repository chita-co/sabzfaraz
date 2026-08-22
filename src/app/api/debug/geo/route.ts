import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "ADMIN") return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });

  return NextResponse.json({
    country: request.headers.get("x-vercel-ip-country"),
    city: request.headers.get("x-vercel-ip-city"),
    region: request.headers.get("x-vercel-ip-country-region"),
    forwardedFor: request.headers.get("x-forwarded-for"),
  });
}