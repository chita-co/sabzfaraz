// src/app/admin/orders/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { earnPointsForOrder, refundRedeemedPoints, reverseEarnedPoints } from "@/lib/loyalty/ledger";
import { createNotification } from "@/lib/notifications";

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "در انتظار پرداخت",
  PROCESSING: "در حال پردازش",
  PACKING: "آماده‌سازی و بسته‌بندی",
  SHIPPED: "ارسال شده",
  DELIVERED: "تحویل داده شده",
  CANCELLED: "لغو شده",
};

export async function updateOrderStatus(orderId: string, status: string) {
  const supabase = await createClient();

  const { data: existingOrder } = await supabase
    .from("orders")
    .select("status, user_id, order_number")
    .eq("id", orderId)
    .single();

  const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
  if (error) return { error: "خطا در تغییر وضعیت: " + error.message };

  if (existingOrder && existingOrder.status !== status && existingOrder.user_id) {
    const fromLabel = ORDER_STATUS_LABELS[existingOrder.status] ?? existingOrder.status;
    const toLabel = ORDER_STATUS_LABELS[status] ?? status;
    try {
      await createNotification(
        existingOrder.user_id,
        "بروزرسانی وضعیت سفارش 📦",
        `وضعیت سفارش ${existingOrder.order_number} از «${fromLabel}» به «${toLabel}» تغییر کرد.`
      );
    } catch (e) {
      console.error("خطا در ارسال نوتیفیکیشن تغییر وضعیت:", e);
    }
  }

  if (status === "DELIVERED") {
    try {
      await earnPointsForOrder(orderId);
    } catch (e) {
      console.error("خطا در ثبت امتیاز وفاداری:", e);
    }
  }

  if (status === "CANCELLED") {
    try {
      await refundRedeemedPoints(orderId);
      await reverseEarnedPoints(orderId);
    } catch (e) {
      console.error("خطا در بازگشت امتیاز وفاداری:", e);
    }
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true };
}

export async function startOrderTracking(orderId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({ tracking_started_at: new Date().toISOString() })
    .eq("id", orderId);
  if (error) return { error: error.message };
  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true };
}

export async function deleteOrder(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("orders").delete().eq("id", id);
  if (error) return { error: "خطا در حذف سفارش: " + error.message };
  revalidatePath("/admin/orders");
  return { success: true };
}

export async function markOrderViewedAction(orderId: string) {
  const supabase = await createClient();
  await supabase.from("orders").update({ admin_viewed_at: new Date().toISOString() }).eq("id", orderId);
  return { success: true };
}

export async function deleteStaleOrdersAction(daysOld: number) {
  const supabase = await createClient();
  const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("orders")
    .delete()
    .eq("payment_status", "PENDING")
    .lt("created_at", cutoff)
    .select("id");

  if (error) return { error: "خطا در حذف سفارش‌های رهاشده: " + error.message };
  revalidatePath("/admin/orders");
  return { success: true, count: data?.length ?? 0 };
}