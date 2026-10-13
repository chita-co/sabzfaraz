"use server";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/notifications";
import { sendSms } from "@/lib/sms";
import { creditWallet } from "@/lib/wallet/creditWallet";
import {
  addBulkPayment,
  loadBulkMoney,
  syncBulkOrderRow,
  type BulkMoney,
} from "@/lib/bulkOrder/orderMirror";

const fa = (n: number) => n.toLocaleString("fa-IR");
const normPhone = (s: string) => s.replace(/\D/g, "").replace(/^98/, "").replace(/^0/, "");
const normName = (s: string) => s.replace(/\s+/g, " ").trim();

function revalidateBulk(requestId: string) {
  revalidatePath("/admin/bulk-orders");
  revalidatePath(`/admin/bulk-orders/${requestId}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin/finance/offline-payments");
  revalidatePath(`/bulk-order/${requestId}`);
  revalidatePath("/profile/orders");
}

// اعلان داخل سایت و در صورت وجود متن، پیامک به مشتری
async function notifyCustomer(userId: string, title: string, message: string, smsText?: string) {
  await createNotification(userId, title, message);
  if (!smsText) return;
  const admin = createAdminClient();
  const { data: prof } = await admin.from("profiles").select("phone").eq("id", userId).single();
  if (prof?.phone) {
    try {
      await sendSms(prof.phone, smsText);
    } catch (e) {
      console.error(e);
    }
  }
}

// مبلغی که برای بازپرداخت‌های در جریان رزرو شده است
function reservedRefund(money: BulkMoney) {
  return money.payments
    .filter((p) => p.kind === "REFUND" && (p.status === "PENDING_DETAILS" || p.status === "AWAITING_PAYOUT"))
    .reduce((s, p) => s + p.amount, 0);
}

export async function setBulkFinalTotal(requestId: string, amount: number) {
  await requireAdmin();
  if (!Number.isInteger(amount) || amount <= 0) return { error: "مبلغ کل نامعتبر است." };

  const admin = createAdminClient();
  const { request, money, error: loadErr } = await loadBulkMoney(admin, requestId);
  if (loadErr || !request || !money) return { error: loadErr ?? "درخواست یافت نشد." };

  const { error } = await admin
    .from("bulk_order_requests")
    .update({
      final_total_amount: amount,
      final_total_set_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId);
  if (error) return { error: error.message };

  const syncErr = await syncBulkOrderRow(admin, requestId);
  if (syncErr) return { error: syncErr };

  const diff = amount - money.netPaid;
  let text: string;
  if (diff > 0) {
    text = `مبلغ کل نهایی سفارش ${request.request_number} ${fa(amount)} تومان است. مانده قابل پرداخت: ${fa(diff)} تومان. از بخش سفارش جمعی در سایت پرداخت کنید.`;
  } else if (diff < 0) {
    text = `مبلغ کل نهایی سفارش ${request.request_number} ${fa(amount)} تومان است. مبلغ ${fa(-diff)} تومان قابل بازپرداخت به شماست.`;
  } else {
    text = `مبلغ کل نهایی سفارش ${request.request_number} ${fa(amount)} تومان است و سفارش شما تسویه است.`;
  }

  await notifyCustomer(request.user_id, "مبلغ نهایی سفارش جمعی ثبت شد", text, `سبزفراز\n${text}`);
  revalidateBulk(requestId);
  return { success: true };
}

// تأیید واریز مانده‌ای که مشتری اعلام کرده
export async function confirmAwaitingBalance(paymentId: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { data: row } = await admin
    .from("bulk_order_payments")
    .select("id, request_id, kind, status, amount")
    .eq("id", paymentId)
    .single();
  if (!row || row.kind !== "BALANCE" || row.status !== "AWAITING_CONFIRMATION") {
    return { error: "این پرداخت در انتظار تأیید نیست." };
  }

  const { error } = await admin
    .from("bulk_order_payments")
    .update({ status: "PAID", updated_at: new Date().toISOString() })
    .eq("id", paymentId);
  if (error) return { error: error.message };

  const syncErr = await syncBulkOrderRow(admin, row.request_id);
  if (syncErr) return { error: syncErr };

  const { request } = await loadBulkMoney(admin, row.request_id);
  if (request) {
    const msg = `واریز ${fa(row.amount)} تومان بابت سفارش ${request.request_number} تأیید شد.`;
    await notifyCustomer(request.user_id, "واریز مانده تأیید شد ✅", msg, `سبزفراز\n${msg}`);
  }
  revalidateBulk(row.request_id);
  return { success: true };
}

export async function rejectAwaitingBalance(paymentId: string, reason: string) {
  await requireAdmin();
  if (!reason.trim()) return { error: "دلیل رد الزامی است." };

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("bulk_order_payments")
    .select("id, request_id, kind, status, amount")
    .eq("id", paymentId)
    .single();
  if (!row || row.kind !== "BALANCE" || row.status !== "AWAITING_CONFIRMATION") {
    return { error: "این پرداخت در انتظار تأیید نیست." };
  }

  const { error } = await admin
    .from("bulk_order_payments")
    .update({ status: "FAILED", payment_error: reason.trim(), updated_at: new Date().toISOString() })
    .eq("id", paymentId);
  if (error) return { error: error.message };

  const syncErr = await syncBulkOrderRow(admin, row.request_id);
  if (syncErr) return { error: syncErr };

  const { request } = await loadBulkMoney(admin, row.request_id);
  if (request) {
    const msg = `واریز ${fa(row.amount)} تومان بابت سفارش ${request.request_number} تأیید نشد. دلیل: ${reason.trim()}`;
    await notifyCustomer(request.user_id, "واریز مانده تأیید نشد", msg, `سبزفراز\n${msg}`);
  }
  revalidateBulk(row.request_id);
  return { success: true };
}

// بازپرداخت به کیف پول: مشتری با شماره و نام ثبت‌شده شناسایی می‌شود
export async function refundToWallet(
  requestId: string,
  input: { amount: number; phone: string; fullName: string; note: string }
) {
  await requireAdmin();
  if (!Number.isInteger(input.amount) || input.amount <= 0) return { error: "مبلغ نامعتبر است." };

  const admin = createAdminClient();
  const loaded = await loadBulkMoney(admin, requestId);
  if (loaded.error || !loaded.request || !loaded.money) return { error: loaded.error ?? "درخواست یافت نشد." };
  const { request, money } = loaded;

  const available = money.netPaid - reservedRefund(money);
  if (input.amount > available) {
    return { error: `حداکثر مبلغ قابل بازپرداخت ${fa(available)} تومان است.` };
  }

  const { data: prof } = await admin
    .from("profiles")
    .select("id, full_name, phone")
    .eq("id", request.user_id)
    .single();
  if (!prof) return { error: "پروفایل کاربر یافت نشد." };
  if (normPhone(prof.phone ?? "") !== normPhone(input.phone)) {
    return { error: "شماره موبایل با کاربر این سفارش مطابقت ندارد." };
  }
  if (normName(prof.full_name ?? "") !== normName(input.fullName)) {
    return { error: "نام کاربر با نام ثبت‌شده مطابقت ندارد." };
  }

  const credit = await creditWallet(request.user_id, input.amount, `بازپرداخت سفارش جمعی ${request.request_number}`);
  if (credit.error) return { error: credit.error };

  const err = await addBulkPayment(admin, request, {
    kind: "REFUND",
    method: "WALLET",
    amount: input.amount,
    status: "PAID",
    note: input.note.trim() || null,
  });
  if (err) return { error: "کیف پول شارژ شد ولی ثبت دفتر با خطا مواجه شد: " + err };

  const msg = `مبلغ ${fa(input.amount)} تومان بابت سفارش ${request.request_number} به کیف پول شما بازگردانده شد.`;
  await notifyCustomer(request.user_id, "بازپرداخت به کیف پول", msg, `سبزفراز\n${msg}`);
  revalidateBulk(requestId);
  return { success: true };
}

// ایجاد درخواست بازپرداخت به کارت یا شبا: مشتری باید اطلاعات حساب را ثبت کند
export async function createRefundRequest(
  requestId: string,
  input: { amount: number; method: "CARD_TO_CARD" | "SHEBA"; note: string }
) {
  await requireAdmin();
  if (!Number.isInteger(input.amount) || input.amount <= 0) return { error: "مبلغ نامعتبر است." };

  const admin = createAdminClient();
  const loaded = await loadBulkMoney(admin, requestId);
  if (loaded.error || !loaded.request || !loaded.money) return { error: loaded.error ?? "درخواست یافت نشد." };
  const { request, money } = loaded;

  const available = money.netPaid - reservedRefund(money);
  if (input.amount > available) {
    return { error: `حداکثر مبلغ قابل بازپرداخت ${fa(available)} تومان است.` };
  }

  const err = await addBulkPayment(admin, request, {
    kind: "REFUND",
    method: input.method,
    amount: input.amount,
    status: "PENDING_DETAILS",
    note: input.note.trim() || null,
  });
  if (err) return { error: err };

  const msg = `برای دریافت بازپرداخت ${fa(input.amount)} تومان بابت سفارش ${request.request_number}، لطفاً در صفحه‌ی سفارش جمعی ${input.method === "SHEBA" ? "شماره شبا" : "شماره کارت"} و نام صاحب حساب را ثبت کنید.`;
  await notifyCustomer(request.user_id, "اطلاعات حساب برای بازپرداخت", msg, `سبزفراز\n${msg}`);
  revalidateBulk(requestId);
  return { success: true };
}

// ادمین بعد از واریز دستی، شماره پیگیری را ثبت می‌کند
export async function markRefundPaid(paymentId: string, reference: string) {
  await requireAdmin();
  if (!reference.trim()) return { error: "شماره پیگیری واریز را وارد کنید." };

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("bulk_order_payments")
    .select("id, request_id, kind, status, amount")
    .eq("id", paymentId)
    .single();
  if (!row || row.kind !== "REFUND" || row.status !== "AWAITING_PAYOUT") {
    return { error: "این بازپرداخت در انتظار پرداخت نیست." };
  }

  const { error } = await admin
    .from("bulk_order_payments")
    .update({ status: "PAID", sep_ref_num: reference.trim(), updated_at: new Date().toISOString() })
    .eq("id", paymentId);
  if (error) return { error: error.message };

  const syncErr = await syncBulkOrderRow(admin, row.request_id);
  if (syncErr) return { error: syncErr };

  const { request } = await loadBulkMoney(admin, row.request_id);
  if (request) {
    const msg = `مبلغ ${fa(row.amount)} تومان بابت سفارش ${request.request_number} به حساب شما واریز شد. کد پیگیری: ${reference.trim()}`;
    await notifyCustomer(request.user_id, "بازپرداخت انجام شد", msg, `سبزفراز\n${msg}`);
  }
  revalidateBulk(row.request_id);
  return { success: true };
}

export async function cancelRefundRequest(paymentId: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { data: row } = await admin
    .from("bulk_order_payments")
    .select("id, request_id, kind, status")
    .eq("id", paymentId)
    .single();
  if (!row || row.kind !== "REFUND" || (row.status !== "PENDING_DETAILS" && row.status !== "AWAITING_PAYOUT")) {
    return { error: "این بازپرداخت قابل لغو نیست." };
  }

  const { error } = await admin
    .from("bulk_order_payments")
    .update({ status: "FAILED", payment_error: "لغو توسط ادمین", updated_at: new Date().toISOString() })
    .eq("id", paymentId);
  if (error) return { error: error.message };

  const syncErr = await syncBulkOrderRow(admin, row.request_id);
  if (syncErr) return { error: syncErr };
  revalidateBulk(row.request_id);
  return { success: true };
}

// ادمین مبلغ اضافه‌ای را از مشتری درخواست می‌کند و توضیح را ثبت می‌کند
export async function requestBalanceFromCustomer(requestId: string, amount: number, note: string) {
  await requireAdmin();
  if (!Number.isInteger(amount) || amount <= 0) return { error: "مبلغ درخواستی نامعتبر است." };

  const admin = createAdminClient();
  const { request, money, error: loadErr } = await loadBulkMoney(admin, requestId);
  if (loadErr || !request || !money) return { error: loadErr ?? "درخواست یافت نشد." };

  const base = money.total ?? money.netPaid;
  const newTotal = base + amount;

  const { error } = await admin
    .from("bulk_order_requests")
    .update({
      final_total_amount: newTotal,
      final_total_set_at: new Date().toISOString(),
      balance_note: note.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId);
  if (error) return { error: error.message };

  const syncErr = await syncBulkOrderRow(admin, requestId);
  if (syncErr) return { error: syncErr };

  const text =
    `برای سفارش ${request.request_number} مبلغ ${fa(amount)} تومان قابل پرداخت است.` +
    (note.trim() ? ` توضیح: ${note.trim()}` : "") +
    " از بخش سفارش جمعی در سایت پرداخت کنید.";
  await notifyCustomer(request.user_id, "درخواست پرداخت مبلغ اضافه", text, `سبزفراز\n${text}`);

  revalidateBulk(requestId);
  return { success: true };
}