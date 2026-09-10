// src/app/api/calendar/notes/route.ts
// GET  → همه‌ی یادداشت‌های روزانه‌ی کاربر لاگین‌شده
// POST { date, content } → ثبت/به‌روزرسانی یادداشت یک روز

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ notes: [] });

  const { data } = await supabase.from("calendar_day_notes").select("note_date, content, updated_at").eq("user_id", user.id);
  return NextResponse.json({
    notes: (data ?? []).map((n) => ({ date: n.note_date, content: n.content, updatedAt: n.updated_at })),
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "ابتدا وارد حساب کاربری‌تان شوید." }, { status: 401 });

  const body = await request.json();
  if (!body.date) return NextResponse.json({ error: "تاریخ الزامی است." }, { status: 400 });

  const { error } = await supabase.from("calendar_day_notes").upsert(
    { user_id: user.id, note_date: body.date, content: String(body.content ?? "").slice(0, 5000), updated_at: new Date().toISOString() },
    { onConflict: "user_id,note_date" }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
