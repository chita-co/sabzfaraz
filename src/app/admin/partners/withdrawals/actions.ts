// src/app/admin/partners/withdrawals/actions.ts
"use server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { revalidatePath } from "next/cache";

export async function approveWithdrawalAction(requestId: string, referenceNumber: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { data: req } = await admin.from("partner_withdrawal_requests").select("*").eq("id", requestId).single();
  if (!req || req.status !== "PENDING") return { error: "درخواست معتبر نیست" };

  const { data: partner } = await admin.from("partners").select("wallet_available_balance").eq("id", req.partner_id).single();
  if (!partner || partner.wallet_available_balance < req.amount) return { error: "موجودی کافی نیست" };

  await admin.from("partners").update({ wallet_available_balance: partner.wallet_available_balance - req.amount }).eq("id", req.partner_id);

  const description = `برداشت ${req.amount.toLocaleString("fa-IR")} تومان پرداخت شد — پیگیری: ${referenceNumber}`;
  const { data: linked } = await admin
    .from("partner_wallet_transactions")
    .update({ status: "AVAILABLE", description })
    .eq("withdrawal_request_id", requestId)
    .select("id");
  if (!linked || linked.length === 0) {
    await admin.from("partner_wallet_transactions").insert({
      partner_id: req.partner_id, type: "WITHDRAWAL", amount: -req.amount, status: "AVAILABLE",
      description, withdrawal_request_id: requestId,
    });
  }
  await admin.from("partner_withdrawal_requests").update({ status: "PAID", reference_number: referenceNumber, processed_at: new Date().toISOString() }).eq("id", requestId);

  await createNotification(req.partner_id, "برداشت شما پرداخت شد ✅", `مبلغ ${req.amount.toLocaleString("fa-IR")} تومان واریز شد. کد پیگیری: ${referenceNumber}`);
  revalidatePath("/admin/partners/withdrawals");
  revalidatePath("/partner/wallet");
  return { success: true };
}

export async function rejectWithdrawalAction(requestId: string, adminNote?: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { data: req } = await admin.from("partner_withdrawal_requests").select("partner_id, amount, status").eq("id", requestId).single();
  if (!req || req.status !== "PENDING") return { error: "درخواست معتبر نیست" };
  const reason = adminNote?.trim() || null;

  await admin
    .from("partner_withdrawal_requests")
    .update({ status: "REJECTED", admin_note: reason, processed_at: new Date().toISOString() })
    .eq("id", requestId);

  const description = `درخواست برداشت ${req.amount.toLocaleString("fa-IR")} تومان رد شد${reason ? ` — دلیل: ${reason}` : ""}`;
  const { data: linked } = await admin
    .from("partner_wallet_transactions")
    .update({ status: "REJECTED", description })
    .eq("withdrawal_request_id", requestId)
    .select("id");
  if (!linked || linked.length === 0) {
    const { error: txError } = await admin.from("partner_wallet_transactions").insert({
      partner_id: req.partner_id, type: "WITHDRAWAL", amount: -req.amount, status: "REJECTED",
      description, withdrawal_request_id: requestId,
    });
    if (txError) console.error("خطا در ثبت تراکنش رد شدن:", txError.message);
  }

  try {
    await createNotification(
      req.partner_id,
      "درخواست برداشت رد شد ❌",
      `درخواست برداشت ${req.amount.toLocaleString("fa-IR")} تومان شما رد شد.${reason ? `\nدلیل: ${reason}` : ""}`
    );
  } catch (e) {
    console.error("خطا در ارسال نوتیفیکیشن:", e);
  }

  revalidatePath("/admin/partners/withdrawals");
  revalidatePath("/partner/wallet");
  return { success: true };
}