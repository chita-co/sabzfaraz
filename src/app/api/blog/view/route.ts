import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const { postId } = await req.json();
  if (!postId) return NextResponse.json({ ok: false }, { status: 400 });
  const admin = createAdminClient();
  await admin.rpc("increment_blog_post_view", { p_post_id: postId });
  return NextResponse.json({ ok: true });
}