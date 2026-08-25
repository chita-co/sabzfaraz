import { NextRequest, NextResponse } from "next/server";
import { runBlogBot } from "@/lib/blog/generatePost";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const isVercelCron = req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
  const isManual = req.nextUrl.searchParams.get("secret") === process.env.BLOG_BOT_SECRET;
  if (!isVercelCron && !isManual) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });

  try {
    const limitParam = req.nextUrl.searchParams.get("limit");
    const limit = limitParam ? Math.min(10, Math.max(1, parseInt(limitParam, 10))) : 3;
    return NextResponse.json(await runBlogBot(limit));
  } catch (e: unknown) {
    console.error("generate-blog-posts cron:", e);
    const message = e instanceof Error ? e.message : "خطای ناشناخته";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}