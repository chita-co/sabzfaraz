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

export async function updatePartnerInfoAction(partnerId: string, input: {
  businessName: string; contactName: string; phone: string; email: string; nationalId: string;
  address: string; bio: string; shebaNumber: string; cardNumber: string; logoUrl: string | null;
  maxActiveProducts: number | null; maxActiveOrders: number | null; aiDailyRequestLimit: number | null;
}) {
  const admin = createAdminClient();
  const { data: current } = await admin.from("partners").select("phone").eq("id", partnerId).single();
  if (!current) return { error: "همکار یافت نشد" };

  if (input.phone.trim() !== current.phone) {
    const { error: authError } = await admin.auth.admin.updateUserById(partnerId, { phone: input.phone.trim() });
    if (authError) return { error: "خطا در تغییر شماره ورود: " + authError.message };
  }

  const { error } = await admin.from("partners").update({
    business_name: input.businessName.trim(),
    contact_name: input.contactName.trim() || null,
    phone: input.phone.trim(),
    email: input.email.trim() || null,
    national_id: input.nationalId.trim() || null,
    address: input.address.trim(),
    bio: input.bio.trim() || null,
    sheba_number: input.shebaNumber.trim() || null,
    card_number: input.cardNumber.trim() || null,
    logo_url: input.logoUrl,
    max_active_products: input.maxActiveProducts,
    max_active_orders: input.maxActiveOrders,
    ai_daily_request_limit: input.aiDailyRequestLimit,
  }).eq("id", partnerId);

  if (error) return { error: error.message };
  revalidatePath(`/admin/partners/${partnerId}`);
  return { success: true };
}