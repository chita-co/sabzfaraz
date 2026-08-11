"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/notifications";
import { sendBulkOrderDepositSms } from "@/lib/sms";

interface StoreItemInput {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

interface MarketItemInput {
  name: string;
  quantity: number;
  minPrice: number | null;
  maxPrice: number | null;
  finalUnitPrice?: number | null;
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
    .select("user_id, request_number, profile:profiles(phone)")
    .eq("id", requestId)
    .single();
  if (!request) return { error: "درخواست یافت نشد." };

  const expiresAt = new Date(
    Date.now() + 3 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { error } = await supabase
    .from("bulk_order_requests")
    .update({
      status: "SUPPLY_POSSIBLE",
      deposit_amount: depositAmount,
      bank_account_id: bankAccountId,
      deposit_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId);
  if (error) return { error: error.message };

  await createNotification(
    request.user_id,
    "امکان تأمین سفارش جمعی شما فراهم شد 🎉",
    `درخواست ${request.request_number} تأیید شد. لطفاً تا ۳ روز آینده بیعانه‌ی ${depositAmount.toLocaleString("fa-IR")} تومان را پرداخت کنید.`
  );

  const phone = (
    request as { profile?: { phone?: string } | null }
  ).profile?.phone;
  if (phone) {
    try {
      await sendBulkOrderDepositSms(phone, depositAmount);
    } catch (e) {
      console.error("خطا در ارسال پیامک:", e);
    }
  }

  revalidatePath("/admin/bulk-orders");
  revalidatePath(`/admin/bulk-orders/${requestId}`);
  return { success: true };
}

export async function markSupplyNotPossible(
  requestId: string,
  reason: string
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
      deposit_paid_at: new Date().toISOString(),
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

export async function rejectDepositPayment(requestId: string) {
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
      deposit_payment_method: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId);
  if (error) return { error: error.message };

  await supabase.from("bulk_order_messages").insert({
    request_id: requestId,
    sender_role: "ADMIN",
    sender_name: "سیستم",
    message:
      "پرداخت اعلام‌شده تأیید نشد. لطفاً دوباره بررسی و پرداخت را تکرار کنید یا از طریق پیام‌ها با ما در ارتباط باشید.",
  });
  await createNotification(
    request.user_id,
    "پرداخت شما تأیید نشد",
    `پرداخت اعلام‌شده برای سفارش ${request.request_number} تأیید نشد. جزئیات را در بخش پیام‌ها ببینید.`
  );

  revalidatePath("/admin/bulk-orders");
  revalidatePath(`/admin/bulk-orders/${requestId}`);
  return { success: true };
}

export async function setBulkOrderStatusManually(
  requestId: string,
  status: string
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
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", requestId);
  if (error) return { error: error.message };

  const labels: Record<string, string> = {
    PREPARING: "در حال تهیه",
    COMPLETED: "تکمیل‌شده / ارسال‌شده",
  };
  if (labels[status]) {
    await createNotification(
      request.user_id,
      "به‌روزرسانی سفارش جمعی",
      `وضعیت سفارش ${request.request_number} به «${labels[status]}» تغییر کرد.`
    );
  }

  revalidatePath("/admin/bulk-orders");
  revalidatePath(`/admin/bulk-orders/${requestId}`);
  return { success: true };
}

export async function sendAdminBulkMessage(
  requestId: string,
  message: string
) {
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