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

  const { data: owningOrder } = await supabase
    .from("orders")
    .select("id, shipping_method:shipping_methods(name)")
    .eq("user_id", user.id)
    .eq("postal_tracking_code", trimmed)
    .maybeSingle();

  if (!owningOrder) return { status: "unauthorized" as const };

  const shippingMethod = owningOrder.shipping_method as
    | { name: string }
    | { name: string }[]
    | null;
  const courierHint = Array.isArray(shippingMethod)
    ? shippingMethod[0]?.name ?? null
    : shippingMethod?.name ?? null;

  return getPostalTrackingStatus(trimmed, courierHint);
}