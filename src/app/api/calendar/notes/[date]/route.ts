// src/app/api/calendar/notes/[date]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "ابتدا وارد حساب کاربری‌تان شوید." }, { status: 401 });

  const { error } = await supabase.from("calendar_day_notes").delete().eq("user_id", user.id).eq("note_date", date);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
