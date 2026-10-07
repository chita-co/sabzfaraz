"use server";

import { randomInt } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isValidIranianNationalId, toEnglishDigits } from "@/lib/nationalId";
import { verifyShahkarMatch } from "@/lib/shahkar";
import { isShahkarVerified, saveShahkarVerification } from "@/lib/shahkarCache";
import { findNationalIdHolder, releaseUnverifiedNationalId } from "@/lib/identity";
import { sendQuickOtpSms } from "@/lib/sms";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const fullName = formData.get("fullName") as string;
  // توجه: شماره موبایل از اینجا قابل تغییر نیست؛ تغییر شماره فقط با کد پیامکی (requestPhoneChangeOtp / confirmPhoneChange)

  const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", user.id);
  if (error) return { error: "خطا در ذخیره اطلاعات: " + error.message };

  revalidatePath("/profile");
  return { success: true };
}

export async function addAddress(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("addresses").insert({
    user_id: user.id,
    full_name: formData.get("fullName") as string,
    phone: formData.get("phone") as string,
    province: formData.get("province") as string,
    city: formData.get("city") as string,
    postal_code: formData.get("postalCode") as string,
    address_line: formData.get("addressLine") as string,
  });

  if (error) return { error: "خطا در ثبت آدرس: " + error.message };
  revalidatePath("/profile");
  return { success: true };
}

export async function updateAddress(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("addresses")
    .update({
      full_name: formData.get("fullName") as string,
      phone: formData.get("phone") as string,
      province: formData.get("province") as string,
      city: formData.get("city") as string,
      postal_code: formData.get("postalCode") as string,
      address_line: formData.get("addressLine") as string,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: "خطا در ویرایش آدرس: " + error.message };
  revalidatePath("/profile");
  return { success: true };
}

export async function deleteAddress(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("addresses").delete().eq("id", id);
  if (error) return { error: "خطا در حذف آدرس: " + error.message };
  revalidatePath("/profile");
  return { success: true };
}

// ───────── احراز هویت (تطابق کد ملی و موبایل از طریق زوهال) ─────────
const IDENTITY_MAX_FAILED_ATTEMPTS = 5;
const IDENTITY_ATTEMPT_WINDOW_MS = 24 * 60 * 60 * 1000;

export type VerifyIdentityResult =
  | { success: true; nationalId: string }
  | { error: string; code?: "MISMATCH" | "INVALID" | "DUPLICATE" | "PHONE" | "LIMIT" | "SERVICE" | "LOCKED" };

export async function verifyIdentityAction(nationalIdInput: string): Promise<VerifyIdentityResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ابتدا وارد حساب کاربری شوید." };

  const nationalId = toEnglishDigits(String(nationalIdInput ?? "")).replace(/\s/g, "");
  if (!isValidIranianNationalId(nationalId)) {
    return { error: "کد ملی وارد شده معتبر نیست.", code: "INVALID" };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("phone, national_id, identity_verified, identity_attempt_count, identity_attempt_window_start")
    .eq("id", user.id)
    .single();
  if (!profile) return { error: "اطلاعات حساب شما یافت نشد." };

  // هویت قبلاً احراز شده؛ همان کد ملی → موفق، کد دیگر → ممنوع
  if (profile.identity_verified) {
    if (profile.national_id === nationalId) return { success: true, nationalId };
    return {
      error: "هویت شما قبلاً احراز شده و کد ملی قابل تغییر نیست. برای تغییر با پشتیبانی تماس بگیرید.",
      code: "LOCKED",
    };
  }

  // شماره موبایل حساب باید معتبر باشد (تطابق با همین شماره انجام می‌شود)
  const mobile = toEnglishDigits(String(profile.phone ?? "")).replace(/\s/g, "");
  if (!/^09\d{9}$/.test(mobile)) {
    return {
      error: "شماره موبایل حساب شما معتبر نیست. ابتدا شماره موبایل را در بخش «اطلاعات حساب» اصلاح کنید.",
      code: "PHONE",
    };
  }

  // مالک فعلی این کد ملی: اگر «احراز شده» باشد رد می‌کنیم؛ اگر «احراز نشده» (ثبت‌نام سریع/تصویری) باشد
  // و مالکیتِ شما با زوهال ثابت شود، کد ملی از آن حساب آزاد و به شما داده می‌شود.
  const holder = await findNationalIdHolder(nationalId, user.id);
  if (holder?.identity_verified) {
    return { error: "این کد ملی قبلاً برای حساب کاربری دیگری ثبت و احراز شده است.", code: "DUPLICATE" };
  }

  // سقف تلاش ناموفق (کنترل هزینه‌ی استعلام)
  const now = Date.now();
  const windowStart = profile.identity_attempt_window_start
    ? new Date(profile.identity_attempt_window_start).getTime()
    : null;
  const windowActive = windowStart !== null && now - windowStart < IDENTITY_ATTEMPT_WINDOW_MS;
  const failedCount = windowActive ? profile.identity_attempt_count ?? 0 : 0;
  if (failedCount >= IDENTITY_MAX_FAILED_ATTEMPTS) {
    return {
      error: "تعداد تلاش‌های ناموفق بیش از حد مجاز بود. لطفاً ۲۴ ساعت بعد دوباره تلاش کنید یا با پشتیبانی تماس بگیرید.",
      code: "LIMIT",
    };
  }

  // اول کش؛ اگر این جفت قبلاً تأیید شده، استعلام جدید لازم نیست
  let matched = await isShahkarVerified(mobile, nationalId);

  if (!matched) {
    try {
      matched = await verifyShahkarMatch(nationalId, mobile);
    } catch {
      return {
        error: "در حال حاضر امکان بررسی کد ملی وجود ندارد. لطفاً چند دقیقه دیگر دوباره تلاش کنید.",
        code: "SERVICE",
      };
    }

    if (!matched) {
      await admin
        .from("profiles")
        .update({
          identity_attempt_count: failedCount + 1,
          identity_attempt_window_start: windowActive
            ? profile.identity_attempt_window_start
            : new Date().toISOString(),
        })
        .eq("id", user.id);
      return {
        error: "کد ملی باید متعلق به صاحب همین شماره موبایل باشد.",
        code: "MISMATCH",
      };
    }

    try {
      await saveShahkarVerification(mobile, nationalId);
    } catch (e) {
      console.error("خطا در ذخیره کش شاهکار:", e);
    }
  }

  // مالکیت اثبات شد → اگر حسابِ احرازنشده‌ی دیگری این کد ملی را داشت، آزادش کن
  if (holder) {
    await releaseUnverifiedNationalId(holder.id, nationalId);
  }

  const { error: updateError } = await admin
    .from("profiles")
    .update({
      national_id: nationalId,
      identity_verified: true,
      identity_verified_at: new Date().toISOString(),
      identity_attempt_count: 0,
      identity_attempt_window_start: null,
    })
    .eq("id", user.id);
  if (updateError) {
    return { error: "خطا در ذخیره‌ی اطلاعات: " + updateError.message, code: "SERVICE" };
  }

  revalidatePath("/profile");
  return { success: true, nationalId };
}

// ───────── تغییر شماره موبایل با کد پیامکی ─────────
const PHONE_OTP_TTL_MS = 2 * 60 * 1000;
const PHONE_OTP_RESEND_GAP_MS = 60 * 1000;
const PHONE_OTP_MAX_PER_USER_HOUR = 5;
const PHONE_OTP_MAX_PER_PHONE_HOUR = 3;
const PHONE_OTP_MAX_ATTEMPTS = 5;

function normalizeMobile(v: string) {
  return toEnglishDigits(String(v ?? "")).replace(/\s/g, "");
}

export async function requestPhoneChangeOtp(newPhoneInput: string): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ابتدا وارد حساب کاربری شوید." };

  const newPhone = normalizeMobile(newPhoneInput);
  if (!/^09\d{9}$/.test(newPhone)) {
    return { error: "شماره موبایل معتبر نیست. مثال: 09123456789" };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("phone").eq("id", user.id).single();
  if (!profile) return { error: "اطلاعات حساب شما یافت نشد." };
  if (normalizeMobile(profile.phone ?? "") === newPhone) {
    return { error: "این شماره همان شماره فعلی حساب شماست." };
  }

  const { data: taken } = await admin
    .from("profiles")
    .select("id")
    .eq("phone", newPhone)
    .neq("id", user.id)
    .limit(1)
    .maybeSingle();
  if (taken) return { error: "این شماره موبایل برای حساب کاربری دیگری ثبت شده است." };

  const now = Date.now();
  const hourAgo = new Date(now - 3600 * 1000).toISOString();

  // پاکسازی رکوردهای قدیمی‌تر از یک روز
  await admin.from("phone_change_otps").delete().lt("created_at", new Date(now - 24 * 3600 * 1000).toISOString());

  const { data: mine } = await admin
    .from("phone_change_otps")
    .select("created_at")
    .eq("user_id", user.id)
    .gte("created_at", hourAgo)
    .order("created_at", { ascending: false });
  if (mine && mine.length > 0) {
    const wait = Math.ceil((PHONE_OTP_RESEND_GAP_MS - (now - new Date(mine[0].created_at).getTime())) / 1000);
    if (wait > 0) return { error: `لطفاً ${wait} ثانیه دیگر دوباره تلاش کنید.` };
    if (mine.length >= PHONE_OTP_MAX_PER_USER_HOUR) {
      return { error: "تعداد درخواست‌ها بیش از حد مجاز است. لطفاً کمی بعد دوباره تلاش کنید." };
    }
  }

  // جلوگیری از بمباران پیامکی یک شماره‌ی خاص
  const { count: toPhone } = await admin
    .from("phone_change_otps")
    .select("id", { count: "exact", head: true })
    .eq("new_phone", newPhone)
    .gte("created_at", hourAgo);
  if ((toPhone ?? 0) >= PHONE_OTP_MAX_PER_PHONE_HOUR) {
    return { error: "برای این شماره درخواست‌های زیادی ثبت شده است. لطفاً کمی بعد دوباره تلاش کنید." };
  }

  const code = String(randomInt(100000, 1000000)); // ۶ رقمی
  const { data: inserted, error: insErr } = await admin
    .from("phone_change_otps")
    .insert({
      user_id: user.id,
      new_phone: newPhone,
      code,
      expires_at: new Date(now + PHONE_OTP_TTL_MS).toISOString(),
    })
    .select("id")
    .single();
  if (insErr || !inserted) return { error: "خطا در ساخت کد تایید." };

  try {
    await sendQuickOtpSms(newPhone, code);
  } catch (e) {
    console.error("خطا در ارسال پیامک تغییر شماره:", e);
    await admin.from("phone_change_otps").delete().eq("id", inserted.id);
    return { error: "خطا در ارسال پیامک. لطفاً دوباره تلاش کنید." };
  }

  return { success: true };
}

export async function confirmPhoneChange(
  newPhoneInput: string,
  codeInput: string
): Promise<{ success: true; phone: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ابتدا وارد حساب کاربری شوید." };

  const newPhone = normalizeMobile(newPhoneInput);
  const code = toEnglishDigits(String(codeInput ?? "")).replace(/\s/g, "");
  if (!/^09\d{9}$/.test(newPhone)) return { error: "شماره موبایل معتبر نیست." };
  if (!/^\d{6}$/.test(code)) return { error: "کد ۶ رقمی را کامل وارد کنید." };

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("phone_change_otps")
    .select("id, code, new_phone, attempts, expires_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!row || row.new_phone !== newPhone || new Date(row.expires_at).getTime() < Date.now()) {
    return { error: "کد وارد شده اشتباه یا منقضی شده است." };
  }
  if ((row.attempts ?? 0) >= PHONE_OTP_MAX_ATTEMPTS) {
    return { error: "تعداد تلاش‌ها بیش از حد مجاز بود. لطفاً کد جدید دریافت کنید." };
  }
  if (row.code !== code) {
    await admin.from("phone_change_otps").update({ attempts: (row.attempts ?? 0) + 1 }).eq("id", row.id);
    return { error: "کد وارد شده اشتباه یا منقضی شده است." };
  }

  // بررسی مجدد یکتایی شماره (race بین درخواست و تایید)
  const { data: taken } = await admin
    .from("profiles")
    .select("id")
    .eq("phone", newPhone)
    .neq("id", user.id)
    .limit(1)
    .maybeSingle();
  if (taken) return { error: "این شماره موبایل برای حساب کاربری دیگری ثبت شده است." };

  // اگر جفت (شماره جدید + کد ملی فعلی) قبلاً در زوهال تأیید شده باشد، احراز حفظ می‌شود؛ وگرنه لغو می‌شود
  const { data: cur } = await admin.from("profiles").select("national_id").eq("id", user.id).single();
  const stillVerified = !!cur?.national_id && (await isShahkarVerified(newPhone, cur.national_id));

  const { error: updErr } = await admin
    .from("profiles")
    .update({
      phone: newPhone,
      identity_verified: stillVerified,
      identity_verified_at: stillVerified ? new Date().toISOString() : null,
      identity_attempt_count: 0,
      identity_attempt_window_start: null,
    })
    .eq("id", user.id);
  if (updErr) return { error: "خطا در ذخیره‌ی شماره جدید: " + updErr.message };

  await admin.from("phone_change_otps").delete().eq("user_id", user.id);
  revalidatePath("/profile");
  return { success: true, phone: newPhone };
}