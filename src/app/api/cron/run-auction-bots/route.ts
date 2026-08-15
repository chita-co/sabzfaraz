import { NextRequest, NextResponse } from "next/server";
import { runAuctionBotsOnce } from "@/lib/auction/runBots";

export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  }
  const result = await runAuctionBotsOnce();
  return NextResponse.json(result);
}