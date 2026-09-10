// src/app/api/calendar/events/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "ابتدا وارد حساب کاربری‌تان شوید." }, { status: 401 });

  const body = await request.json();
  const patch: Record<string, unknown> = {};
  if (body.title !== undefined) patch.title = String(body.title).slice(0, 200);
  if (body.description !== undefined) patch.description = body.description ? String(body.description).slice(0, 2000) : null;
  if (body.category !== undefined) patch.category = body.category;
  if (body.color !== undefined) patch.color = body.color;
  if (body.location !== undefined) patch.location = body.location;
  if (body.url !== undefined) patch.url = body.url;
  if (body.startAt !== undefined) patch.start_at = body.startAt;
  if (body.endAt !== undefined) patch.end_at = body.endAt;
  if (body.allDay !== undefined) patch.all_day = !!body.allDay;
  if (body.recurrence !== undefined) patch.recurrence = body.recurrence;
  if (body.remindersMinutes !== undefined) patch.reminders_minutes = body.remindersMinutes;
  patch.updated_at = new Date().toISOString();

  // RLS خودش تضمین می‌کند که کاربر فقط رویداد خودش را ویرایش می‌کند
  const { data, error } = await supabase.from("calendar_events").update(patch).eq("id", id).select("*").single();
  if (error) return NextResponse.json({ error: "ویرایش ناموفق بود: " + error.message }, { status: 500 });

  return NextResponse.json({ event: data });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "ابتدا وارد حساب کاربری‌تان شوید." }, { status: 401 });

  const { error } = await supabase.from("calendar_events").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "حذف ناموفق بود: " + error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
