"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { notifyAllAdmins } from "@/lib/notifications";

export async function sendUserBulkMessage(requestId: string, message: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "دسترسی غیرمجاز" };

  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
  const { data: request } = await supabase.from("bulk_order_requests").select("request_number").eq("id", requestId).single();

  const { error } = await supabase.from("bulk_order_messages").insert({
    request_id: requestId, sender_role: "USER", sender_name: profile?.full_name || "کاربر", message,
  });
  if (error) return { error: error.message };

  if (request) await notifyAllAdmins("پیام جدید درباره‌ی سفارش جمعی", `پیام جدیدی درباره‌ی سفارش ${request.request_number} دریافت شد.`);

  revalidatePath(`/bulk-order/${requestId}`);
  return { success: true };
}

export async function getBulkMessages(requestId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("bulk_order_messages").select("*").eq("request_id", requestId).order("created_at", { ascending: true });
  return data ?? [];
}