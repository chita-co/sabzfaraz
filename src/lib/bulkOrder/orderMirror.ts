import { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

export type BulkPaymentKind = "DEPOSIT" | "BALANCE" | "REFUND";
export type BulkPaymentStatus =
  | "PENDING"
  | "AWAITING_CONFIRMATION"
  | "PAID"
  | "FAILED"
  | "PENDING_DETAILS"
  | "AWAITING_PAYOUT";

export interface BulkPaymentRow {
  id: string;
  kind: BulkPaymentKind;
  method: string;
  amount: number;
  status: BulkPaymentStatus;
  sep_token: string | null;
  sep_ref_num: string | null;
  payment_error: string | null;
  note: string | null;
  payout_holder_name: string | null;
  payout_card_number: string | null;
  payout_sheba: string | null;
  created_at: string;
}

export interface BulkRequestRow {
  id: string;
  request_number: string;
  user_id: string;
  address_id: string | null;
  deposit_amount: number | null;
  final_total_amount: number | null;
  shipping_name?: string | null;
  shipping_cost?: number | null;
  collection_fee?: number | null;
  shipping_weight_grams?: number | null;
  balance_note?: string | null;
  status: string;
  store_items?: unknown;
  market_items?: unknown;
}

export interface BulkMoney {
  total: number | null;
  paidIn: number;
  refunded: number;
  netPaid: number;
  balance: number | null;
  payments: BulkPaymentRow[];
}

export function computeMoney(finalTotal: number | null, payments: BulkPaymentRow[]): BulkMoney {
  const sumPaid = (kind: BulkPaymentKind) =>
    payments
      .filter((p) => p.kind === kind && p.status === "PAID")
      .reduce((s, p) => s + p.amount, 0);
  const paidIn = sumPaid("DEPOSIT") + sumPaid("BALANCE");
  const refunded = sumPaid("REFUND");
  const netPaid = paidIn - refunded;
  return {
    total: finalTotal,
    paidIn,
    refunded,
    netPaid,
    balance: finalTotal === null ? null : finalTotal - netPaid,
    payments,
  };
}

export async function loadBulkMoney(
  admin: AdminClient,
  requestId: string
): Promise<{ request: BulkRequestRow | null; money: BulkMoney | null; error: string | null }> {
  const { data: request, error: reqErr } = await admin
    .from("bulk_order_requests")
    .select("*")
    .eq("id", requestId)
    .single();
  if (reqErr || !request) {
    return { request: null, money: null, error: reqErr?.message ?? "درخواست یافت نشد." };
  }
  const { data: rows, error: payErr } = await admin
    .from("bulk_order_payments")
    .select("*")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });
  if (payErr) return { request: request as BulkRequestRow, money: null, error: payErr.message };

  return {
    request: request as BulkRequestRow,
    money: computeMoney(request.final_total_amount ?? null, (rows ?? []) as BulkPaymentRow[]),
    error: null,
  };
}

// ساخت ردیف سفارش در orders اگر وجود نداشته باشد
async function ensureBulkOrderRow(admin: AdminClient, req: BulkRequestRow): Promise<string | null> {
  const { data: existing, error: findErr } = await admin
    .from("orders")
    .select("id")
    .eq("bulk_request_id", req.id)
    .maybeSingle();
  if (findErr) return findErr.message;
  if (existing) return null;
  if (!req.address_id) return "آدرس سفارش جمعی مشخص نیست.";

  const { error } = await admin.from("orders").insert({
    order_number: req.request_number,
    user_id: req.user_id,
    address_id: req.address_id,
    bulk_request_id: req.id,
    order_type: "BULK_ORDER",
    status: "PENDING",
    payment_status: "PENDING",
    payment_method: "ONLINE",
    total_amount: req.deposit_amount ?? 0,
    shipping_cost: req.shipping_cost ?? 0,
    customer_note: "سفارش جمعی — جزئیات بیعانه و مانده در صفحه‌ی سفارش",
  });
  return error?.message ?? null;
}

// به‌روزرسانی مبالغ و وضعیت پرداخت ردیف orders بر اساس دفتر پرداخت‌ها
export async function syncBulkOrderRow(admin: AdminClient, requestId: string): Promise<string | null> {
  const loaded = await loadBulkMoney(admin, requestId);
  if (loaded.error || !loaded.request || !loaded.money) {
    return loaded.error ?? "درخواست یافت نشد.";
  }
  const { request, money } = loaded;

  const nonRefund = money.payments.filter((p) => p.kind !== "REFUND");
  const latest = nonRefund[nonRefund.length - 1];
  const paidOnline = [...nonRefund].reverse().find((p) => p.method === "ONLINE" && p.status === "PAID");
  const hasAwaiting = money.payments.some((p) => p.status === "AWAITING_CONFIRMATION");

  let paymentStatus: string;
  if (money.netPaid > 0) {
    paymentStatus = money.balance !== null && money.balance > 0 ? "PARTIAL" : "PAID";
  } else if (money.refunded > 0) {
    paymentStatus = "REFUNDED";
  } else if (hasAwaiting) {
    paymentStatus = "AWAITING_CONFIRMATION";
  } else if (latest?.status === "FAILED") {
    paymentStatus = "FAILED";
  } else {
    paymentStatus = "PENDING";
  }

  const { error } = await admin
    .from("orders")
    .update({
      total_amount: money.total ?? request.deposit_amount ?? 0,
      payment_status: paymentStatus,
      payment_method: latest?.method ?? "ONLINE",
      sep_token: latest?.method === "ONLINE" ? latest.sep_token : null,
      sep_ref_num: paidOnline?.sep_ref_num ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("bulk_request_id", requestId);
  return error?.message ?? null;
}

// ثبت یک پرداخت جدید (بیعانه، مانده یا بازپرداخت)
export async function addBulkPayment(
  admin: AdminClient,
  req: BulkRequestRow,
  p: {
    kind: BulkPaymentKind;
    method: string;
    amount: number;
    status: BulkPaymentStatus;
    sep_token?: string | null;
    note?: string | null;
  }
): Promise<string | null> {
  if (!Number.isInteger(p.amount) || p.amount <= 0) return "مبلغ پرداخت نامعتبر است.";

  const ensureErr = await ensureBulkOrderRow(admin, req);
  if (ensureErr) return ensureErr;

  // تلاش‌های معلق قبلی همین نوع پرداخت جایگزین می‌شوند
  if (p.status === "PENDING" || p.status === "AWAITING_CONFIRMATION") {
    const { error: supErr } = await admin
      .from("bulk_order_payments")
      .update({ status: "FAILED", payment_error: "با تلاش جدید جایگزین شد", updated_at: new Date().toISOString() })
      .eq("request_id", req.id)
      .eq("kind", p.kind)
      .in("status", ["PENDING", "AWAITING_CONFIRMATION"]);
    if (supErr) return supErr.message;
  }

  const { error } = await admin.from("bulk_order_payments").insert({
    request_id: req.id,
    kind: p.kind,
    method: p.method,
    amount: p.amount,
    status: p.status,
    sep_token: p.sep_token ?? null,
    note: p.note ?? null,
  });
  if (error) return error.message;

  return await syncBulkOrderRow(admin, req.id);
}

// تغییر وضعیت آخرین پرداخت معلق (مثلاً نتیجه‌ی درگاه یا تأیید ادمین)
export async function settleBulkPayment(
  admin: AdminClient,
  requestId: string,
  opts: {
    kind: BulkPaymentKind;
    from: BulkPaymentStatus[];
    to: "PAID" | "FAILED" | null; // null یعنی وضعیت تغییر نکند و فقط خطا ثبت شود
    method?: string;
    refNum?: string | null;
    error?: string | null;
  }
): Promise<{ error: string | null; found: boolean }> {
  let query = admin
    .from("bulk_order_payments")
    .select("id")
    .eq("request_id", requestId)
    .eq("kind", opts.kind)
    .in("status", opts.from);
  if (opts.method) query = query.eq("method", opts.method);

  const { data: rows, error: findErr } = await query.order("created_at", { ascending: false }).limit(1);
  if (findErr) return { error: findErr.message, found: false };
  const target = rows?.[0];
  if (!target) return { error: null, found: false };

  const patch: Record<string, unknown> = {
    payment_error: opts.error ?? null,
    updated_at: new Date().toISOString(),
  };
  if (opts.to) patch.status = opts.to;
  if (opts.refNum) patch.sep_ref_num = opts.refNum;

  const { error } = await admin.from("bulk_order_payments").update(patch).eq("id", target.id);
  if (error) return { error: error.message, found: true };

  const syncErr = await syncBulkOrderRow(admin, requestId);
  return { error: syncErr, found: true };
}

export async function getPendingAmount(
  admin: AdminClient,
  requestId: string,
  kind: BulkPaymentKind
): Promise<number | null> {
  const { data, error } = await admin
    .from("bulk_order_payments")
    .select("amount")
    .eq("request_id", requestId)
    .eq("kind", kind)
    .eq("status", "PENDING")
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) return null;
  return data?.[0]?.amount ?? null;
}

// خروجی: null یعنی پرداخت مانده مجاز است؛ در غیر این صورت دلیل را برمی‌گرداند
export function canPayBalance(request: BulkRequestRow, money: BulkMoney): string | null {
  if (request.status === "NOT_POSSIBLE" || request.status === "CLOSED_UNPAID") {
    return "این سفارش بسته شده است.";
  }
  if (money.total === null) return "مبلغ کل نهایی هنوز تعیین نشده است.";
  if (!money.balance || money.balance <= 0) return "مانده‌ای برای پرداخت وجود ندارد.";
  if (!money.payments.some((p) => p.kind === "DEPOSIT" && p.status === "PAID")) {
    return "ابتدا بیعانه را پرداخت کنید.";
  }
  if (money.payments.some((p) => p.kind === "BALANCE" && p.status === "AWAITING_CONFIRMATION")) {
    return "پرداخت قبلی شما در انتظار تأیید است.";
  }
  return null;
}