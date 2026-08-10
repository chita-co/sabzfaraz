"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/notifications";
import { sendBulkOrderDepositSms } from "@/lib/sms";

// تایپ‌های مربوط به اقلام فروشگاهی و بازاری
export interface StoreItemInput {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface MarketItemInput {
  name: string;
  quantity: number;
  minPrice: number | null;
  maxPrice: number | null;
}

export async function updateBulkOrderItems(
  requestId: string,
  storeItems: StoreItemInput[],
  marketItems: MarketItemInput[]
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("bulk_order_requests")
    .update({
      store_items: storeItems,
      market_items: marketItems,
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (error) return { error: error.message };
  revalidatePath(`/admin/bulk-orders/${requestId}`);
  return { success: true };
}

export async function updateInternalNote(requestId: string, note: string) {
  const supabase = await createClient();
  await supabase
    .from("bulk_order_requests")
    .update({ admin_internal_note: note })
    .eq("id", requestId);

  revalidatePath(`/admin/bulk-orders/${requestId}`);
  return { success: true };
}

export async function markSupplyPossible(
  requestId: string,
  depositAmount: number,
  bankAccountId: string
) {
  const supabase = await createClient();
  const { data: request } = await supabase
    .from("bulk_order_requests")
    .select("user_id, request_number")
    .eq("id", requestId)
    .single();

  if (!request) return { error: "درخواست یافت نشد." };

  const { error } = await supabase
    .from("bulk_order_requests")
    .update({
      status: "SUPPLY_POSSIBLE",
      deposit_amount: depositAmount,
      bank_account_id: bankAccountId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (error) return { error: error.message };

  await createNotification(
    request.user_id,
    "امکان تأمین سفارش جمعی شما فراهم شد 🎉",
    `درخواست ${request.request_number} تأیید شد. لطفاً بیعانه‌ی ${depositAmount.toLocaleString("fa-IR")} تومان را پرداخت کنید.`
  );

  const { data: profile } = await supabase
    .from("profiles")
    .select("phone")
    .eq("id", request.user_id)
    .single();

  if (profile?.phone) {
    try {
      await sendBulkOrderDepositSms(profile.phone, depositAmount);
    } catch (e) {
      console.error("خطا در ارسال پیامک:", e);
    }
  }

  revalidatePath("/admin/bulk-orders");
  revalidatePath(`/admin/bulk-orders/${requestId}`);
  return { success: true };
}

export async function markSupplyNotPossible(requestId: string, reason: string) {
  const supabase = await createClient();
  const { data: request } = await supabase
    .from("bulk_order_requests")
    .select("user_id, request_number")
    .eq("id", requestId)
    .single();

  if (!request) return { error: "درخواست یافت نشد." };

  const { error } = await supabase
    .from("bulk_order_requests")
    .update({
      status: "NOT_POSSIBLE",
      rejection_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (error) return { error: error.message };

  await createNotification(
    request.user_id,
    "درخواست سفارش جمعی شما",
    `متأسفانه امکان تأمین درخواست ${request.request_number} وجود ندارد. دلیل: ${reason}`
  );

  revalidatePath("/admin/bulk-orders");
  revalidatePath(`/admin/bulk-orders/${requestId}`);
  return { success: true };
}

export async function confirmDepositPayment(requestId: string) {
  const supabase = await createClient();
  const { data: request } = await supabase
    .from("bulk_order_requests")
    .select("user_id, request_number")
    .eq("id", requestId)
    .single();

  if (!request) return { error: "درخواست یافت نشد." };

  const { error } = await supabase
    .from("bulk_order_requests")
    .update({
      status: "PREPARING",
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (error) return { error: error.message };

  await createNotification(
    request.user_id,
    "پرداخت بیعانه تأیید شد ✅",
    `پرداخت شما برای درخواست ${request.request_number} تأیید شد و در حال تهیه‌ی کالاهاست.`
  );

  revalidatePath("/admin/bulk-orders");
  revalidatePath(`/admin/bulk-orders/${requestId}`);
  return { success: true };
}

export async function markBulkOrderCompleted(requestId: string) {
  const supabase = await createClient();
  const { data: request } = await supabase
    .from("bulk_order_requests")
    .select("user_id, request_number")
    .eq("id", requestId)
    .single();

  if (!request) return { error: "درخواست یافت نشد." };

  const { error } = await supabase
    .from("bulk_order_requests")
    .update({
      status: "COMPLETED",
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (error) return { error: error.message };

  await createNotification(
    request.user_id,
    "سفارش جمعی شما تکمیل شد 📦",
    `درخواست ${request.request_number} تکمیل و ارسال شد.`
  );

  revalidatePath("/admin/bulk-orders");
  revalidatePath(`/admin/bulk-orders/${requestId}`);
  return { success: true };
}

export async function sendAdminBulkMessage(requestId: string, message: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "دسترسی غیرمجاز" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const { data: request } = await supabase
    .from("bulk_order_requests")
    .select("user_id, request_number")
    .eq("id", requestId)
    .single();

  if (!request) return { error: "درخواست یافت نشد." };

  const { error } = await supabase.from("bulk_order_messages").insert({
    request_id: requestId,
    sender_role: "ADMIN",
    sender_name: profile?.full_name || "پشتیبانی",
    message,
  });

  if (error) return { error: error.message };

  await createNotification(
    request.user_id,
    "پیام جدید درباره‌ی سفارش جمعی",
    `پیام جدیدی درباره‌ی درخواست ${request.request_number} دریافت کردید.`
  );

  revalidatePath(`/admin/bulk-orders/${requestId}`);
  return { success: true };
}

export async function getAdminBulkMessages(requestId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bulk_order_messages")
    .select("*")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });
  return data ?? [];
}