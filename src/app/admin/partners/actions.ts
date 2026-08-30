"use server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications";
import { sendSms } from "@/lib/sms";
import { revalidatePath } from "next/cache";

export async function approvePartnerAction(partnerId: string) {
  const admin = createAdminClient();
  const { data: partner } = await admin.from("partners").select("phone, business_name").eq("id", partnerId).single();
  await admin.from("partners").update({ status: "ACTIVE", approved_at: new Date().toISOString() }).eq("id", partnerId);

  await createNotification(partnerId, "خوش آمدید! 🎉", "حساب همکاری شما تأیید شد و می‌توانید محصولات خود را ثبت کنید.");
  if (partner?.phone) {
    try { await sendSms(partner.phone, `سبزفراز\nحساب همکاری «${partner.business_name}» تأیید شد. اکنون می‌توانید وارد پنل همکار شوید.`); } catch (e) { console.error(e); }
  }
  revalidatePath("/admin/partners");
  return { success: true };
}

export async function rejectPartnerAction(partnerId: string, reason: string) {
  const admin = createAdminClient();
  await admin.from("partners").update({ status: "REJECTED", rejection_reason: reason }).eq("id", partnerId);
  revalidatePath("/admin/partners");
  return { success: true };
}

export async function suspendPartnerAction(partnerId: string) {
  const admin = createAdminClient();
  await admin.from("partners").update({ status: "SUSPENDED" }).eq("id", partnerId);
  await admin.from("products").update({ is_active: false }).eq("partner_id", partnerId);
  revalidatePath("/admin/partners");
  return { success: true };
}

export async function applyPenaltyAction(partnerId: string, amount: number, reason: string, orderId?: string) {
  const admin = createAdminClient();
  const { data: partner } = await admin.from("partners").select("wallet_available_balance").eq("id", partnerId).single();
  if (!partner) return { error: "همکار یافت نشد" };
  if (partner.wallet_available_balance < amount) return { error: "موجودی قابل‌برداشت همکار برای این جریمه کافی نیست." };

  await admin.from("partners").update({ wallet_available_balance: partner.wallet_available_balance - amount }).eq("id", partnerId);
  await admin.from("partner_wallet_transactions").insert({
    partner_id: partnerId, type: "PENALTY", amount: -amount, status: "AVAILABLE", description: reason,
  });
  await admin.from("partner_penalties").insert({ partner_id: partnerId, order_id: orderId ?? null, amount, reason });

  await createNotification(partnerId, "جریمه اعمال شد ⚠️", `مبلغ ${amount.toLocaleString("fa-IR")} تومان بابت «${reason}» از حساب شما کسر شد.`);
  revalidatePath(`/admin/partners/${partnerId}`);
  return { success: true };
}

export async function activatePartnerAction(partnerId: string) {
  const admin = createAdminClient();
  await admin.from("partners").update({ status: "ACTIVE" }).eq("id", partnerId);
  await createNotification(partnerId, "حساب شما فعال شد ✅", "حساب همکاری شما مجدداً فعال شد.");
  revalidatePath(`/admin/partners/${partnerId}`);
  revalidatePath("/admin/partners");
  return { success: true };
}

export async function overrideRatingAction(partnerId: string, rating: number) {
  const admin = createAdminClient();
  const clamped = Math.max(1, Math.min(5, rating));
  await admin.from("partners").update({ rating_avg: clamped }).eq("id", partnerId);
  revalidatePath(`/admin/partners/${partnerId}`);
  return { success: true };
}