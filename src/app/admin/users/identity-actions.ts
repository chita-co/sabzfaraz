"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendIdentityRequestSms } from "@/lib/sms";
import { toEnglishDigits } from "@/lib/nationalId";

const SMS_COOLDOWN_MS = 10 * 60 * 1000; // حداقل فاصله بین دو پیامک برای یک کاربر

export async function sendIdentityRequestSmsAction(userId: string) {
  try {
    await requireAdmin();
  } catch {
    return { error: "دسترسی غیرمجاز" };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, phone, identity_verified, identity_sms_sent_at")
    .eq("id", userId)
    .single();
  if (!profile) return { error: "کاربر یافت نشد." };
  if (profile.identity_verified) return { error: "هویت این کاربر قبلاً احراز شده است." };

  const mobile = toEnglishDigits(String(profile.phone ?? "")).replace(/\s/g, "");
  if (!/^09\d{9}$/.test(mobile)) {
    return { error: "شماره موبایل این کاربر معتبر نیست." };
  }

  if (
    profile.identity_sms_sent_at &&
    Date.now() - new Date(profile.identity_sms_sent_at).getTime() < SMS_COOLDOWN_MS
  ) {
    return { error: "پیامک احراز هویت به‌تازگی برای این کاربر ارسال شده است. چند دقیقه بعد دوباره تلاش کنید." };
  }

  try {
    await sendIdentityRequestSms(mobile, profile.full_name ?? "");
  } catch (e) {
    console.error("خطا در ارسال پیامک احراز هویت:", e);
    return { error: "ارسال پیامک ناموفق بود. تنظیمات sms.ir و قالب را بررسی کنید." };
  }

  await admin
    .from("profiles")
    .update({ identity_sms_sent_at: new Date().toISOString() })
    .eq("id", userId);

  revalidatePath(`/admin/users/${userId}`);
  return { success: true };
}