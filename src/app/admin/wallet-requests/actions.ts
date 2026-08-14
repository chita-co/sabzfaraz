"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { creditWallet } from "@/lib/wallet/creditWallet";
import { createNotification } from "@/lib/notifications";

export async function approveTopupRequest(id: string) {
  const supabase = await createClient();
  const { data: reqRow } = await supabase.from("wallet_topup_requests").select("*").eq("id", id).single();
  if (!reqRow) return { error: "درخواست یافت نشد." };
  if (reqRow.status !== "PENDING") return { error: "این درخواست قبلاً بررسی شده است." };

  await creditWallet(reqRow.user_id, reqRow.amount, "شارژ دستی کیف پول (تأیید ادمین)");
  await supabase.from("wallet_topup_requests").update({ status: "APPROVED", reviewed_at: new Date().toISOString() }).eq("id", id);
  await createNotification(reqRow.user_id, "شارژ کیف پول تأیید شد ✅", `مبلغ ${reqRow.amount.toLocaleString("fa-IR")} تومان به کیف پول شما اضافه شد.`);

  revalidatePath("/admin/wallet-requests");
  return { success: true };
}

export async function rejectTopupRequest(id: string, reason: string) {
  const supabase = await createClient();
  const { data: reqRow } = await supabase.from("wallet_topup_requests").select("user_id, amount").eq("id", id).single();
  if (!reqRow) return { error: "درخواست یافت نشد." };

  await supabase.from("wallet_topup_requests").update({ status: "REJECTED", admin_note: reason, reviewed_at: new Date().toISOString() }).eq("id", id);
  await createNotification(reqRow.user_id, "درخواست شارژ کیف پول رد شد", `درخواست شارژ ${reqRow.amount.toLocaleString("fa-IR")} تومانی شما رد شد. دلیل: ${reason}`);

  revalidatePath("/admin/wallet-requests");
  return { success: true };
}