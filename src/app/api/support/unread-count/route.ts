import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ count: 0 });

  const { data } = await supabase.rpc("count_unread_support_messages_for_user", { p_user_id: user.id });
  return NextResponse.json({ count: Number(data ?? 0) });
}