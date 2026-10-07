import { NextRequest, NextResponse, after } from "next/server";
import { runBlogBot } from "@/lib/blog/generatePost";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const blogSecret = process.env.BLOG_BOT_SECRET;
  const isCron = !!cronSecret && req.headers.get("authorization") === `Bearer ${cronSecret}`;
  const isManual = !!blogSecret && req.nextUrl.searchParams.get("secret") === blogSecret;
  if (!isCron && !isManual) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });

  const limitParam = req.nextUrl.searchParams.get("limit");
  const parsed = limitParam ? parseInt(limitParam, 10) : 3;
  const limit = Math.min(10, Math.max(1, Number.isFinite(parsed) ? parsed : 3));
  const wait = req.nextUrl.searchParams.get("wait") === "1";

  // حالت تست: صبر کن و نتیجه‌ی کامل را برگردان
  if (wait) {
    try {
      return NextResponse.json(await runBlogBot(limit));
    } catch (e: unknown) {
      console.error("generate-blog-posts (wait):", e);
      const message = e instanceof Error ? e.message : "خطای ناشناخته";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  // حالت کرون: فوراً جواب بده و کار را در پس‌زمینه ادامه بده
  after(async () => {
    try {
      const result = await runBlogBot(limit);
      console.log("generate-blog-posts:", JSON.stringify(result).slice(0, 1000));
    } catch (e: unknown) {
      console.error("generate-blog-posts cron:", e);
    }
  });
  return NextResponse.json({ accepted: true, limit }, { status: 202 });
}