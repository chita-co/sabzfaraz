"use server";

import { createClient } from "@/lib/supabase/server";
import { getPostalTrackingStatus } from "@/lib/postTracking";

/**
 * پیگیری وضعیت لحظه‌ای یک مرسوله برای کاربر لاگین‌شده.
 * به‌خاطر امنیت و جلوگیری از سوءاستفاده (پروکسی مجانی به سرویس رهگیری)،
 * فقط کدی قابل پیگیریه که متعلق به یکی از سفارش‌های خودِ همین کاربر باشه.
 */
export async function checkParcelTracking(code: string) {
  const trimmed = code.trim();
  if (!trimmed) return { status: "not_found" as const };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: "unauthorized" as const };

  // مرحله ۱: فقط مالکیت سفارش را چک می‌کنیم — بدون join
  const { data: owningOrder } = await supabase
  .from("orders")
  .select("id, shipping_method_id")
  .eq("user_id", user.id)
  .eq("postal_tracking_code", trimmed)
  .order("created_at", { ascending: false })
  .limit(1)
  .maybeSingle();

  if (!owningOrder) return { status: "unauthorized" as const };

  // مرحله ۲: نام روش ارسال را جدا می‌گیریم (best-effort)
  let courierHint: string | null = null;
  if (owningOrder.shipping_method_id) {
    const { data: sm } = await supabase
      .from("shipping_methods")
      .select("name")
      .eq("id", owningOrder.shipping_method_id)
      .maybeSingle();
    courierHint = sm?.name ?? null;
  }

  return getPostalTrackingStatus(trimmed, courierHint);
}