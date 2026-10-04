// src/app/(auth)/quick-actions.ts
"use server";

import { randomInt, randomBytes } from "crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendQuickOtpSms } from "@/lib/sms";
import { isValidIranianNationalId, toEnglishDigits } from "@/lib/nationalId";
import { getClientIp, hashIp } from "@/lib/analytics/hashIp";

type Purpose = "SIGNUP" | "LOGIN";
type OtpRow = {
  id: string;
  code: string;
  attempts: number;
  expires_at: string;
  full_name: string | null;
  national_id: string | null;
  email: string | null;
};

const OTP_TTL_MS = 2 * 60 * 1000; // اعتبار ۲ دقیقه
const RESEND_GAP_MS = 60 * 1000; // حداقل فاصله‌ی دو درخواست برای یک شماره
const MAX_PER_PHONE_HOUR = 5;
const MAX_PER_IP_HOUR = 15;
const MAX_ATTEMPTS = 5;

function onlyDigits(v: FormDataEntryValue | null): string {
  return toEnglishDigits(String(v ?? "")).replace(/\D/g, "");
}
function isValidMobile(p: string) {
  return /^09\d{9}$/.test(p);
}
function safeRedirect(r: string | null): string {
  if (r && r.startsWith("/") && !r.startsWith("//") && !r.startsWith("/\\")) return r;
  return "/";
}

async function issueOtp(
  purpose: Purpose,
  phone: string,
  extra?: { fullName: string; nationalId: string; email: string | null }
): Promise<{ error?: string; success?: true }> {
  const admin = createAdminClient();
  const now = Date.now();
  const h = await headers();
  const ipHash = hashIp(getClientIp(h as unknown as Headers));

  // پاکسازی رکوردهای قدیمی‌تر از یک روز
  await admin.from("quick_otps").delete().lt("created_at", new Date(now - 24 * 3600 * 1000).toISOString());

  const hourAgo = new Date(now - 3600 * 1000).toISOString();

  const { data: recent } = await admin
    .from("quick_otps")
    .select("created_at")
    .eq("phone", phone)
    .eq("purpose", purpose)
    .gte("created_at", hourAgo)
    .order("created_at", { ascending: false });

  if (recent && recent.length > 0) {
    const last = new Date(recent[0].created_at).getTime();
    const wait = Math.ceil((RESEND_GAP_MS - (now - last)) / 1000);
    if (wait > 0) return { error: `لطفاً ${wait} ثانیه دیگر دوباره تلاش کنید.` };
    if (recent.length >= MAX_PER_PHONE_HOUR) {
      return { error: "تعداد درخواست‌ها بیش از حد مجاز است. لطفاً کمی بعد دوباره تلاش کنید." };
    }
  }

  const { count: ipCount } = await admin
    .from("quick_otps")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", hourAgo);
  if ((ipCount ?? 0) >= MAX_PER_IP_HOUR) {
    return { error: "تعداد درخواست‌ها بیش از حد مجاز است. لطفاً کمی بعد دوباره تلاش کنید." };
  }

  const code = String(randomInt(1000, 10000)); // ۴ رقمی
  const { data: inserted, error: insErr } = await admin
    .from("quick_otps")
    .insert({
      phone,
      purpose,
      code,
      full_name: extra?.fullName ?? null,
      national_id: extra?.nationalId ?? null,
      email: extra?.email ?? null,
      ip_hash: ipHash,
      expires_at: new Date(now + OTP_TTL_MS).toISOString(),
    })
    .select("id")
    .single();
  if (insErr || !inserted) return { error: "خطا در ساخت رمز یکبار مصرف." };

  try {
    await sendQuickOtpSms(phone, code);
  } catch (e) {
    console.error("خطا در ارسال پیامک رمز یکبار مصرف:", e);
    await admin.from("quick_otps").delete().eq("id", inserted.id);
    return { error: "خطا در ارسال پیامک. لطفاً دوباره تلاش کنید." };
  }
  return { success: true };
}

async function getLatestOtp(phone: string, purpose: Purpose): Promise<OtpRow | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("quick_otps")
    .select("id, code, attempts, expires_at, full_name, national_id, email")
    .eq("phone", phone)
    .eq("purpose", purpose)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as OtpRow) ?? null;
}

async function checkCode(row: OtpRow | null, code: string): Promise<string | null> {
  if (!/^\d{4}$/.test(code)) return "رمز ۴ رقمی را کامل وارد کنید.";
  if (!row || new Date(row.expires_at).getTime() < Date.now()) {
    return "رمز وارد شده اشتباه یا منقضی شده است.";
  }
  if (row.attempts >= MAX_ATTEMPTS) {
    return "تعداد تلاش‌های اشتباه بیش از حد مجاز است. لطفاً رمز جدید دریافت کنید.";
  }
  if (row.code !== code) {
    await createAdminClient()
      .from("quick_otps")
      .update({ attempts: row.attempts + 1 })
      .eq("id", row.id);
    return "رمز وارد شده اشتباه است.";
  }
  return null;
}

async function clearOtps(phone: string, purpose: Purpose) {
  await createAdminClient().from("quick_otps").delete().eq("phone", phone).eq("purpose", purpose);
}

// ساخت نشست (کوکی) برای کاربر بدون نیاز به رمز عبور
async function startSession(email: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const tokenHash = data?.properties?.hashed_token;
  if (error || !tokenHash) return "خطا در ورود به حساب. لطفاً دوباره تلاش کنید.";

  const supabase = await createClient();
  let { error: vErr } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "magiclink" });
  if (vErr) {
    const retry = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "email" });
    vErr = retry.error;
  }
  if (vErr) return "خطا در ورود به حساب. لطفاً دوباره تلاش کنید.";
  return null;
}

// ============================================================
// ثبت‌نام سریع
// ============================================================

export async function requestQuickSignupOtp(formData: FormData) {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = onlyDigits(formData.get("phone"));
  const nationalId = onlyDigits(formData.get("nationalId"));
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!fullName) return { error: "نام و نام خانوادگی را وارد کنید." };
  if (fullName.length > 100) return { error: "نام و نام خانوادگی بیش از حد طولانی است." };
  if (!isValidMobile(phone)) return { error: "شماره موبایل معتبر نیست. مثال: 09123456789" };
  if (!isValidIranianNationalId(nationalId)) return { error: "کد ملی وارد شده معتبر نیست." };
  if (email) {
    const emailOk = email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
    if (!emailOk) return { error: "فرمت ایمیل وارد شده صحیح نیست. مثال: name@example.com" };
    if (email.endsWith("@sabzfaraz-users.ir")) return { error: "این ایمیل مجاز نیست. لطفاً ایمیل دیگری وارد کنید." };
  }

  const admin = createAdminClient();
  const { data: byPhone } = await admin.from("profiles").select("id").eq("phone", phone).maybeSingle();
  if (byPhone) return { error: "این شماره موبایل قبلاً ثبت‌نام کرده است. لطفاً وارد شوید." };
  const { data: byNid } = await admin.from("profiles").select("id").eq("national_id", nationalId).maybeSingle();
  if (byNid) return { error: "این کد ملی قبلاً برای یک حساب دیگر ثبت شده است." };
  if (email) {
    const { data: taken, error: rpcErr } = await admin.rpc("email_exists", { p_email: email });
    if (!rpcErr && taken === true) {
      return { error: "این ایمیل قبلاً برای یک حساب دیگر استفاده شده است." };
    }
  }

  return issueOtp("SIGNUP", phone, { fullName, nationalId, email: email || null });
}

export async function verifyQuickSignupOtp(formData: FormData) {
  const phone = onlyDigits(formData.get("phone"));
  const code = onlyDigits(formData.get("code"));
  if (!isValidMobile(phone)) return { error: "شماره موبایل معتبر نیست." };

  const row = await getLatestOtp(phone, "SIGNUP");
  const codeError = await checkCode(row, code);
  if (codeError) return { error: codeError };
  if (!row?.full_name || !row.national_id) {
    return { error: "اطلاعات ثبت‌نام ناقص است. لطفاً دوباره از ابتدا تلاش کنید." };
  }

  const admin = createAdminClient();

  // بررسی مجدد یکتایی (جلوگیری از race condition)
  const { data: byPhone } = await admin.from("profiles").select("id").eq("phone", phone).maybeSingle();
  if (byPhone) return { error: "این شماره موبایل قبلاً ثبت‌نام کرده است." };
  const { data: byNid } = await admin.from("profiles").select("id").eq("national_id", row.national_id).maybeSingle();
  if (byNid) return { error: "این کد ملی قبلاً برای یک حساب دیگر ثبت شده است." };

  const email = row.email || `${phone}@sabzfaraz-users.ir`;
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password: randomBytes(24).toString("base64url"), // رمز تصادفی؛ کاربر می‌تواند بعداً از «فراموشی رمز» رمز بگذارد
    email_confirm: true,
    user_metadata: {
      full_name: row.full_name,
      phone,
      national_id: row.national_id,
      signup_method: "QUICK",
    },
  });
  if (createErr || !created?.user) {
    const msg = (createErr?.message ?? "").toLowerCase();
    if (msg.includes("already")) {
      return {
        error: row.email
          ? "این ایمیل قبلاً برای یک حساب دیگر استفاده شده است."
          : "این شماره موبایل قبلاً ثبت‌نام کرده است.",
      };
    }
    return { error: "خطا در ساخت حساب کاربری. لطفاً دوباره تلاش کنید." };
  }

  const { data: updated, error: updErr } = await admin
    .from("profiles")
    .update({
      full_name: row.full_name,
      phone,
      national_id: row.national_id,
      signup_method: "QUICK",
    })
    .eq("id", created.user.id)
    .select("id");
  if (updErr || !updated || updated.length === 0) {
    console.error("خطا در ذخیره‌ی پروفایل ثبت‌نام سریع:", updErr);
    await admin.auth.admin.deleteUser(created.user.id); // برگرداندن تغییرات
    return { error: "خطا در ذخیره‌ی اطلاعات کاربر. لطفاً دوباره تلاش کنید." };
  }

  const sessionError = await startSession(email);
  if (sessionError) return { error: sessionError };

  await clearOtps(phone, "SIGNUP");
  redirect("/");
}

// ============================================================
// ورود با رمز یکبار مصرف
// ============================================================

export async function requestQuickLoginOtp(formData: FormData) {
  const phone = onlyDigits(formData.get("phone"));
  if (!isValidMobile(phone)) return { error: "شماره موبایل معتبر نیست. مثال: 09123456789" };

  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("id, role")
    .eq("phone", phone)
    .maybeSingle();
  if (error) return { error: "خطا در بررسی شماره. لطفاً دوباره تلاش کنید." };
  if (!profile) {
    return { error: "این شماره هنوز ثبت‌نام نکرده است. ابتدا ثبت‌نام کنید." };
  }
  if (profile.role === "ADMIN") {
    return { error: "ورود مدیران فقط با رمز عبور امکان‌پذیر است." };
  }

  return issueOtp("LOGIN", phone);
}

export async function verifyQuickLoginOtp(formData: FormData) {
  const phone = onlyDigits(formData.get("phone"));
  const code = onlyDigits(formData.get("code"));
  const redirectTo = safeRedirect(String(formData.get("redirect") ?? ""));
  if (!isValidMobile(phone)) return { error: "شماره موبایل معتبر نیست." };

  const row = await getLatestOtp(phone, "LOGIN");
  const codeError = await checkCode(row, code);
  if (codeError) return { error: codeError };

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("id, role").eq("phone", phone).maybeSingle();
  if (!profile) return { error: "این شماره هنوز ثبت‌نام نکرده است." };
  if (profile.role === "ADMIN") return { error: "ورود مدیران فقط با رمز عبور امکان‌پذیر است." };

  const { data: authUser } = await admin.auth.admin.getUserById(profile.id);
  const email = authUser?.user?.email;
  if (!email) return { error: "خطا در یافتن حساب کاربری." };

  const sessionError = await startSession(email);
  if (sessionError) return { error: sessionError };

  await clearOtps(phone, "LOGIN");
  redirect(redirectTo);
}