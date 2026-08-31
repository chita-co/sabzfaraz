import { NextRequest, NextResponse } from "next/server";
import { regenerateAllPartnerProductImages } from "@/lib/partners/regenerateImages";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.PARTNER_IMAGE_CRON_SECRET) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  }

  const limitParam = req.nextUrl.searchParams.get("limit");
  const limit = limitParam ? Math.min(50, Math.max(1, parseInt(limitParam, 10))) : 20;

  try {
    const result = await regenerateAllPartnerProductImages(limit);
    return NextResponse.json(result);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "خطای ناشناخته";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}