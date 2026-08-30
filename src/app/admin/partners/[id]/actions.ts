"use server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications";
import { revalidatePath } from "next/cache";

export async function recordSettlementAction(partnerId: string, amount: number, method: "CARD_TO_CARD" | "SHEBA" | "POS", referenceNumber: string) {
  const admin = createAdminClient();
  const { data: partner } = await admin.from("partners").select("wallet_available_balance, reserve_balance").eq("id", partnerId).single();
  if (!partner) return { error: "همکار یافت نشد" };
  const withdrawable = partner.wallet_available_balance - partner.reserve_balance;
  if (amount <= 0 || amount > withdrawable) return { error: "مبلغ تسویه معتبر نیست." };

  await admin.from("partners").update({ wallet_available_balance: partner.wallet_available_balance - amount }).eq("id", partnerId);
  await admin.from("partner_settlements").insert({ partner_id: partnerId, amount, method, reference_number: referenceNumber });
  await admin.from("partner_wallet_transactions").insert({
    partner_id: partnerId, type: "SETTLEMENT", amount: -amount, status: "AVAILABLE", description: `تسویه حساب — پیگیری: ${referenceNumber}`,
  });

  await createNotification(partnerId, "تسویه حساب انجام شد 💰", `مبلغ ${amount.toLocaleString("fa-IR")} تومان تسویه و پرداخت شد. کد پیگیری: ${referenceNumber}`);
  revalidatePath(`/admin/partners/${partnerId}`);
  return { success: true };
}