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

  // اگه از کامپوننت خودِ روش ارسال (courierHint) پاس داده نشده باشه — مثلاً
  // ادمین کد رو تازه و دستی تایپ کرده و هنوز توی لیستِ سفارش‌های همون صفحه
  // نیست — خودمون مستقیم از دیتابیس، روش ارسالِ سفارشِ صاحبِ این کد رو
  // پیدا می‌کنیم تا تشخیص پست/تیپاکس از همون بار اول درست باشه.
  let finalHint = courierHint;
  if (!finalHint) {
    const { data: owningOrder } = await supabase
      .from("orders")
      .select("shipping_method_id")
      .eq("postal_tracking_code", trimmed)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (owningOrder?.shipping_method_id) {
      const { data: sm } = await supabase
        .from("shipping_methods")
        .select("name")
        .eq("id", owningOrder.shipping_method_id)
        .maybeSingle();
      finalHint = sm?.name ?? null;
    }
  }

  return getPostalTrackingStatus(trimmed, finalHint);
}