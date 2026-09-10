// src/app/api/calendar/events/route.ts
//
// GET  ?from=ISO&to=ISO   → لیست رویدادهای بازه (تعطیلات رسمی برای همه، رویدادهای
//                            شخصی فقط اگر لاگین باشید — همه‌چیز از طریق RLS خودِ
//                            Supabase کنترل می‌شود، نه منطق دستی این‌جا)
// POST { ...event }       → ساخت رویداد جدید (فقط کاربر لاگین‌شده)

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function rowToEvent(row: Record<string, unknown>) {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    category: row.category,
    color: row.color,
    location: row.location,
    url: row.url,
    startAt: row.start_at,
    endAt: row.end_at,
    allDay: row.all_day,
    recurrence: row.recurrence,
    remindersMinutes: row.reminders_minutes ?? [],
    isHoliday: row.is_holiday,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const supabase = await createClient();
  let query = supabase.from("calendar_events").select("*").order("start_at", { ascending: true });
  if (from) query = query.gte("end_at", from);
  if (to) query = query.lte("start_at", to);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ events: [], error: error.message }, { status: 200 });
  }
  return NextResponse.json({ events: (data ?? []).map(rowToEvent) });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "برای افزودن رویداد باید وارد حساب کاربری‌تان شوید." }, { status: 401 });
  }

  const body = await request.json();
  if (!body.title || !body.startAt || !body.endAt) {
    return NextResponse.json({ error: "عنوان، زمان شروع و زمان پایان الزامی است." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("calendar_events")
    .insert({
      user_id: user.id,
      title: String(body.title).slice(0, 200),
      description: body.description ? String(body.description).slice(0, 2000) : null,
      category: body.category ?? "personal",
      color: body.color ?? "#16a34a",
      location: body.location ? String(body.location).slice(0, 200) : null,
      url: body.url ? String(body.url).slice(0, 500) : null,
      start_at: body.startAt,
      end_at: body.endAt,
      all_day: !!body.allDay,
      recurrence: body.recurrence ?? null,
      reminders_minutes: body.remindersMinutes ?? [],
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: "ثبت رویداد ناموفق بود: " + error.message }, { status: 500 });
  }

  return NextResponse.json({ event: rowToEvent(data) }, { status: 201 });
}
