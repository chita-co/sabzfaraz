"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { sendSms } from "@/lib/sms";

function isValidIranianMobile(phone: string) {
  return /^09\d{9}$/.test(phone);
}

export async function signUp(formData: FormData) {
  const fullName = formData.get("fullName") as string;
  const phone = formData.get("phone") as string;
  const emailInput = ((formData.get("email") as string) || "").trim();
  const password = formData.get("password") as string;

  if (!isValidIranianMobile(phone)) {
    return { error: "شماره موبایل معتبر نیست. مثال: 09123456789" };
  }

  const adminClient = createAdminClient();
  const { data: existing } = await adminClient
    .from("profiles")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();

  if (existing) {
    return { error: "این شماره موبایل قبلاً ثبت‌نام کرده است." };
  }

  const email = emailInput || `${phone}@sabzfaraz-users.ir`;

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, phone },
    },
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("already registered") || msg.includes("already exists")) {
      return {
        error: emailInput
          ? "این ایمیل قبلاً استفاده شده است."
          : "خطایی در ثبت‌نام رخ داد، لطفاً یک ایمیل دلخواه هم وارد کنید.",
      };
    }
    return { error: "خطا در ثبت‌نام: " + error.message };
  }

  redirect("/");
}

export async function signIn(formData: FormData) {
  const phone = formData.get("phone") as string;
  const password = formData.get("password") as string;
  const redirectTo = (formData.get("redirect") as string) || "/";

  if (!isValidIranianMobile(phone)) {
    return { error: "شماره موبایل معتبر نیست." };
  }

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from("profiles")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();

  if (!profile) {
    return { error: "شماره موبایل یا رمز عبور اشتباه است." };
  }

  const { data: authUserData } = await adminClient.auth.admin.getUserById(profile.id);
  const email = authUserData?.user?.email;

  if (!email) {
    return { error: "خطا در یافتن حساب کاربری." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("invalid login credentials")) {
      return { error: "شماره موبایل یا رمز عبور اشتباه است." };
    }
    return { error: "خطا در ورود: " + error.message };
  }

  redirect(redirectTo);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordResetOtp(phone: string) {
  if (!isValidIranianMobile(phone)) {
    return { error: "شماره موبایل معتبر نیست." };
  }

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient.from("profiles").select("id").eq("phone", phone).maybeSingle();
  if (!profile) {
    return { error: "کاربری با این شماره موبایل یافت نشد." };
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const { error: insertError } = await adminClient
    .from("password_reset_otps")
    .insert({ phone, code, expires_at: expiresAt });

  if (insertError) return { error: "خطا در ساخت کد بازیابی." };

  try {
    await sendSms(phone, `سبزفراز\nکد تایید بازیابی رمز عبور: ${code}\nاین کد تا ۱۰ دقیقه معتبر است.`);
  } catch {
    return { error: "خطا در ارسال پیامک. لطفاً دوباره تلاش کنید." };
  }

  return { success: true };
}

export async function resetPasswordWithOtp(phone: string, code: string, newPassword: string) {
  if (newPassword.length < 6) {
    return { error: "رمز عبور باید حداقل ۶ کاراکتر باشد." };
  }

  const adminClient = createAdminClient();

  const { data: otpRow } = await adminClient
    .from("password_reset_otps")
    .select("*")
    .eq("phone", phone)
    .eq("code", code)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!otpRow || new Date(otpRow.expires_at) < new Date()) {
    return { error: "کد وارد شده اشتباه یا منقضی شده است." };
  }

  const { data: profile } = await adminClient.from("profiles").select("id").eq("phone", phone).maybeSingle();
  if (!profile) {
    return { error: "کاربری با این شماره موبایل یافت نشد." };
  }

  const { error } = await adminClient.auth.admin.updateUserById(profile.id, { password: newPassword });
  if (error) {
    return { error: "خطا در تغییر رمز عبور: " + error.message };
  }

  await adminClient.from("password_reset_otps").delete().eq("id", otpRow.id);

  return { success: true };
}

// نسخه‌ی ساده‌شده‌ی بازیابی رمز — بدون نیاز به کد پیامکی یک‌بارمصرف
export async function resetPasswordByPhoneOnly(phone: string, newPassword: string) {
  if (!isValidIranianMobile(phone)) {
    return { error: "شماره موبایل معتبر نیست." };
  }
  if (newPassword.length < 6) {
    return { error: "رمز عبور باید حداقل ۶ کاراکتر باشد." };
  }

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient.from("profiles").select("id").eq("phone", phone).maybeSingle();
  if (!profile) {
    return { error: "کاربری با این شماره موبایل یافت نشد." };
  }

  const { error } = await adminClient.auth.admin.updateUserById(profile.id, { password: newPassword });
  if (error) {
    return { error: "خطا در تغییر رمز عبور: " + error.message };
  }

  return { success: true };
}