// src/app/(auth)/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { sendSms, sendTemplateSms, sendSignupOtpSms } from "@/lib/sms";
import { isValidIranianNationalId } from "@/lib/nationalId";
import { verifyShahkarMatch } from "@/lib/shahkar";
import { isShahkarVerified, saveShahkarVerification } from "@/lib/shahkarCache";

function isValidIranianMobile(phone: string) {
  return /^09\d{9}$/.test(phone);
}

// مرحله ۱: بررسی اعتبار اطلاعات + یکتا بودن شماره/کدملی + ارسال کد ۴ رقمی پیامکی
export async function requestSignupOtp(formData: FormData) {
  const fullName = ((formData.get("fullName") as string) || "").trim();
  const phone = ((formData.get("phone") as string) || "").trim();
  const nationalId = ((formData.get("nationalId") as string) || "").trim();

  if (!fullName) {
    return { error: "نام و نام خانوادگی را وارد کنید." };
  }
  if (!isValidIranianMobile(phone)) {
    return { error: "شماره موبایل معتبر نیست. مثال: 09123456789" };
  }
  if (!isValidIranianNationalId(nationalId)) {
    return { error: "کد ملی وارد شده معتبر نیست." };
  }

  const adminClient = createAdminClient();

  const { data: existingPhone } = await adminClient
    .from("profiles")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();
  if (existingPhone) {
    return { error: "این شماره موبایل قبلاً ثبت‌نام کرده است." };
  }

  const { data: existingNationalId } = await adminClient
    .from("profiles")
    .select("id")
    .eq("national_id", nationalId)
    .maybeSingle();
  if (existingNationalId) {
    return { error: "این کد ملی قبلاً برای یک حساب دیگر ثبت شده است." };
  }

// اول cache رو چک کن — اگه قبلاً این جفت تایید شده، دیگه استعلام نزن (صرفه‌جویی هزینه)
  const alreadyVerified = await isShahkarVerified(phone, nationalId);

  if (!alreadyVerified) {
    try {
      const matched = await verifyShahkarMatch(nationalId, phone);
      if (!matched) {
        return { error: "کد ملی و شماره موبایل وارد شده متعلق به یک شخص نیستند." };
      }
      // استعلام موفق بود → ذخیره کن تا دفعات بعد استفاده بشه
      await saveShahkarVerification(phone, nationalId);
    } catch {
      return { error: "در حال حاضر امکان بررسی کد ملی وجود ندارد. لطفاً دوباره تلاش کنید." };
    }
  }

  const code = Math.floor(1000 + Math.random() * 9000).toString(); // ۴ رقمی
  const expiresAt = new Date(Date.now() + 2 * 60 * 1000).toISOString(); // ۲ دقیقه

  await adminClient.from("signup_otps").delete().eq("phone", phone);
  const { error: insertError } = await adminClient
    .from("signup_otps")
    .insert({ phone, code, expires_at: expiresAt });
  if (insertError) return { error: "خطا در ساخت کد تایید." };

  try {
    await sendSignupOtpSms(phone, code);
  } catch {
    return { error: "خطا در ارسال پیامک. لطفاً دوباره تلاش کنید." };
  }

  return { success: true };
}

// مرحله ۲: بررسی کد وارد شده و ساخت حساب کاربری
export async function verifySignupOtpAndCreateAccount(formData: FormData) {
  const fullName = ((formData.get("fullName") as string) || "").trim();
  const phone = ((formData.get("phone") as string) || "").trim();
  const nationalId = ((formData.get("nationalId") as string) || "").trim();
  const emailInput = ((formData.get("email") as string) || "").trim();
  const password = formData.get("password") as string;
  const code = ((formData.get("code") as string) || "").trim();

  if (!isValidIranianMobile(phone)) {
    return { error: "شماره موبایل معتبر نیست." };
  }
  if (!isValidIranianNationalId(nationalId)) {
    return { error: "کد ملی معتبر نیست." };
  }
  if (!code) {
    return { error: "کد تایید را وارد کنید." };
  }

  const adminClient = createAdminClient();

  const { data: otpRow } = await adminClient
    .from("signup_otps")
    .select("*")
    .eq("phone", phone)
    .eq("code", code)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!otpRow || new Date(otpRow.expires_at) < new Date()) {
    return { error: "کد وارد شده اشتباه یا منقضی شده است." };
  }

  // بررسی مجدد یکتایی (جلوگیری از race condition بین درخواست کد و تایید)
  const { data: existingPhone } = await adminClient
    .from("profiles")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();
  if (existingPhone) {
    return { error: "این شماره موبایل قبلاً ثبت‌نام کرده است." };
  }
  const { data: existingNationalId } = await adminClient
    .from("profiles")
    .select("id")
    .eq("national_id", nationalId)
    .maybeSingle();
  if (existingNationalId) {
    return { error: "این کد ملی قبلاً برای یک حساب دیگر ثبت شده است." };
  }

  const email = emailInput || `${phone}@sabzfaraz-users.ir`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, phone, national_id: nationalId },
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

  if (data.user) {
    await adminClient.from("profiles").update({ national_id: nationalId }).eq("id", data.user.id);
  }

  await adminClient.from("signup_otps").delete().eq("id", otpRow.id);

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
  const expiresAt = new Date(Date.now() + 2 * 60 * 1000).toISOString(); // ۲ دقیقه

  const { error: insertError } = await adminClient
    .from("password_reset_otps")
    .insert({ phone, code, expires_at: expiresAt });

  if (insertError) return { error: "خطا در ساخت کد بازیابی." };

  try {
    const templateId = Number(process.env.SMSIR_PASSWORD_RESET_TEMPLATE_ID);
    if (!templateId) {
      // اگر قالب پیامکی تنظیم نشده بود، به روش قبلی (sendSms) ارسال می‌کنیم
      await sendSms(phone, `سبزفراز\nکد تایید بازیابی رمز عبور: ${code}\nاین کد تا ۲ دقیقه معتبر است.`);
    } else {
      await sendTemplateSms(phone, templateId, [{ name: "CODE", value: code }]);
    }
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