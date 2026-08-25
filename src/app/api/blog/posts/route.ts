import { NextRequest, NextResponse } from "next/server";
import { getPublishedPosts } from "@/lib/blog/queries";

export async function GET(req: NextRequest) {
  const page = parseInt(req.nextUrl.searchParams.get("page") ?? "1", 10);
  const pageSize = parseInt(req.nextUrl.searchParams.get("pageSize") ?? "12", 10);
  const categorySlug = req.nextUrl.searchParams.get("category") ?? undefined;
  const q = req.nextUrl.searchParams.get("q") ?? undefined;
  const { posts, total } = await getPublishedPosts({ page, pageSize, categorySlug, search: q });
  return NextResponse.json({ posts, total });
}