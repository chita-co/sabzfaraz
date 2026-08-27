// src/app/admin/orders/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { earnPointsForOrder, refundRedeemedPoints, reverseEarnedPoints } from "@/lib/loyalty/ledger";

export async function updateOrderStatus(orderId: string, status: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
  if (error) return { error: "خطا در تغییر وضعیت: " + error.message };

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