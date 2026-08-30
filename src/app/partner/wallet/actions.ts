"use server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireActivePartner } from "@/lib/partners/auth";
import { getPartnerSettings } from "@/lib/partners/settings";
import { notifyAllAdmins } from "@/lib/notifications";
import { revalidatePath } from "next/cache";

export async function requestWithdrawalAction(amount: number) {
  const partner = await requireActivePartner();
  const settings = await getPartnerSettings();
  const admin = createAdminClient();

  const withdrawable = partner.wallet_available_balance - partner.reserve_balance;
  if (amount < settings.min_withdrawal_amount) return { error: `حداقل مبلغ برداشت ${settings.min_withdrawal_amount.toLocaleString("fa-IR")} تومان است.` };
  if (amount > withdrawable) return { error: "مبلغ درخواستی بیشتر از موجودی قابل‌برداشت شماست." };
  if (!partner.sheba_number && !partner.card_number) return { error: "ابتدا شماره شبا یا کارت را در پروفایل ثبت کنید." };

  const { error } = await admin.from("partner_withdrawal_requests").insert({
    partner_id: partner.id, amount, sheba_number: partner.sheba_number, card_number: partner.card_number,
  });
  if (error) return { error: error.message };

  try {
    await notifyAllAdmins("درخواست برداشت جدید 💸", `«${partner.business_name}» درخواست برداشت ${amount.toLocaleString("fa-IR")} تومانی ثبت کرد.`);
  } catch (e) { console.error(e); }

  revalidatePath("/partner/wallet");
  return { success: true };
}