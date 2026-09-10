"use server";

import { createClient } from "@/lib/supabase/server";
import { getPostalTrackingStatus } from "@/lib/postTracking";

/**
 * پیگیری وضعیت لحظه‌ای یک مرسوله توسط ادمین.
 * برخلاف نسخه‌ی کاربر، اینجا نیازی به مالکیت سفارش نیست، اما همچنان باید
 * کاربر لاگین‌کرده نقش ADMIN داشته باشد (همان الگویی که در بقیه‌ی
 * actionهای ادمین این پروژه استفاده شده) تا این Server Action به‌عنوان
 * یک پروکسی مجانی و بدون کنترل برای سرویس رهگیری سوءاستفاده نشود.
 */
export async function checkParcelTrackingAdmin(code: string, courierHint?: string | null) {
  const trimmed = code.trim();
  if (!trimmed) return { status: "not_found" as const };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "unauthorized" as const };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "ADMIN") return { status: "unauthorized" as const };

  return getPostalTrackingStatus(trimmed, courierHint);
}