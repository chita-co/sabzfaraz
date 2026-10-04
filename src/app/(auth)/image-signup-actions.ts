// src/app/(auth)/image-signup-actions.ts
"use server";

import { randomUUID } from "crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import sharp from "sharp";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidIranianNationalId, toEnglishDigits } from "@/lib/nationalId";
import { getClientIp, hashIp } from "@/lib/analytics/hashIp";

const BUCKET = "id-documents";
const MAX_FILE_BYTES = 4 * 1024 * 1024; // سقف حجم هر فایل ارسالی
const MAX_PER_IP_HOUR = 5;

function onlyDigits(v: FormDataEntryValue | null): string {
  return toEnglishDigits(String(v ?? "")).replace(/\D/g, "");
}

// تشخیص اینکه فایل واقعاً JPEG / PNG / WEBP است (به MIME ارسالی کلاینت اعتماد نمی‌کنیم)
function isSupportedImage(buf: Buffer): boolean {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true; // JPEG
  if (
    buf.length > 8 &&
    buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return true; // PNG
  }
  if (
    buf.length > 12 &&
    buf.subarray(0, 4).toString("ascii") === "RIFF" &&
    buf.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return true; // WEBP
  }
  return false;
}

export async function registerWithImage(formData: FormData): Promise<{ error: string }> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = onlyDigits(formData.get("phone"));
  const nationalId = onlyDigits(formData.get("nationalId"));
  const password = String(formData.get("password") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const file = formData.get("document");

  // ---------- اعتبارسنجی ساختار ----------
  if (!fullName) return { error: "نام و نام خانوادگی را وارد کنید." };
  if (fullName.length > 100) return { error: "نام و نام خانوادگی بیش از حد طولانی است." };
  if (!/^09\d{9}$/.test(phone)) return { error: "شماره موبایل معتبر نیست. مثال: 09123456789" };
  if (!isValidIranianNationalId(nationalId)) return { error: "کد ملی وارد شده معتبر نیست." };
  if (password.length < 6) return { error: "رمز ورود باید حداقل ۶ کاراکتر باشد." };
  if (password.length > 72) return { error: "رمز ورود نباید بیشتر از ۷۲ کاراکتر باشد." };

  if (email) {
    const ok = email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
    if (!ok) return { error: "فرمت ایمیل وارد شده صحیح نیست. مثال: name@example.com" };
    if (email.endsWith("@sabzfaraz-users.ir")) {
      return { error: "این ایمیل مجاز نیست. لطفاً ایمیل دیگری وارد کنید." };
    }
  }

  // ---------- بررسی و پردازش تصویر مدرک ----------
  if (!(file instanceof File) || file.size === 0) {
    return { error: "تصویر کارت ملی یا گواهینامه را انتخاب کنید." };
  }
  if (file.size > MAX_FILE_BYTES) return { error: "حجم تصویر نباید بیشتر از ۴ مگابایت باشد." };

  const rawBuf = Buffer.from(await file.arrayBuffer());
  if (!isSupportedImage(rawBuf)) return { error: "فرمت تصویر باید JPG، PNG یا WEBP باشد." };

  let fileBuf: Buffer;
  try {
    // مثل ثبت‌نام همکار: فشرده‌سازی به WebP با عرض حداکثر ۱۲۰۰ (rotate: اصلاح جهت عکس موبایل)
    fileBuf = await sharp(rawBuf, { limitInputPixels: 50_000_000 })
      .rotate()
      .resize(1200, undefined, { withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    return { error: "تصویر انتخاب‌شده قابل پردازش نیست. لطفاً تصویر دیگری انتخاب کنید." };
  }
  const ext = "webp";
  const mime = "image/webp";
  

  const admin = createAdminClient();

  // ---------- محدودیت تعداد ثبت‌نام برای هر IP ----------
  const h = await headers();
  const ipHash = hashIp(getClientIp(h as unknown as Headers));
  const now = Date.now();
  await admin.from("signup_rate_limits").delete().lt("created_at", new Date(now - 24 * 3600 * 1000).toISOString());
  const { count } = await admin
    .from("signup_rate_limits")
    .select("id", { count: "exact", head: true })
    .eq("kind", "IMAGE_SIGNUP")
    .eq("ip_hash", ipHash)
    .gte("created_at", new Date(now - 3600 * 1000).toISOString());
  if ((count ?? 0) >= MAX_PER_IP_HOUR) {
    return { error: "تعداد درخواست‌ها بیش از حد مجاز است. لطفاً کمی بعد دوباره تلاش کنید." };
  }
  await admin.from("signup_rate_limits").insert({ kind: "IMAGE_SIGNUP", ip_hash: ipHash });

  // ---------- بررسی تکراری بودن (مشترک بین هر سه حالت ثبت‌نام) ----------
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

  // ---------- ساخت کاربر ----------
  const finalEmail = email || `${phone}@sabzfaraz-users.ir`;
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: finalEmail,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, phone, national_id: nationalId, signup_method: "IMAGE" },
  });
  if (createErr || !created?.user) {
    const msg = (createErr?.message ?? "").toLowerCase();
    if (msg.includes("already")) {
      return {
        error: email
          ? "این ایمیل قبلاً برای یک حساب دیگر استفاده شده است."
          : "این شماره موبایل قبلاً ثبت‌نام کرده است.",
      };
    }
    if (msg.includes("password")) {
      return { error: "رمز ورود توسط سیستم پذیرفته نشد. لطفاً رمز دیگری انتخاب کنید." };
    }
    console.error("خطا در ساخت کاربر (ثبت‌نام با تصویر):", createErr);
    return { error: "خطا در ساخت حساب کاربری. لطفاً دوباره تلاش کنید." };
  }
  const userId = created.user.id;

  // ---------- آپلود مدرک در باکت خصوصی ----------
  const path = `${userId}/${randomUUID()}.${ext}`;
  const { error: upErr } = await admin.storage.from(BUCKET).upload(path, fileBuf, {
    contentType: mime,
    upsert: false,
  });
  if (upErr) {
    console.error("خطا در آپلود مدرک:", upErr);
    await admin.auth.admin.deleteUser(userId);
    return { error: "خطا در بارگذاری فایل. لطفاً دوباره تلاش کنید." };
  }

  // ---------- ذخیره‌ی اطلاعات در پروفایل ----------
  const { data: updated, error: updErr } = await admin
    .from("profiles")
    .update({
      full_name: fullName,
      phone,
      national_id: nationalId,
      signup_method: "IMAGE",
      id_document_path: path,
    })
    .eq("id", userId)
    .select("id");
  if (updErr || !updated || updated.length === 0) {
    console.error("خطا در ذخیره‌ی پروفایل (ثبت‌نام با تصویر):", updErr);
    await admin.storage.from(BUCKET).remove([path]);
    await admin.auth.admin.deleteUser(userId);
    return { error: "خطا در ذخیره‌ی اطلاعات کاربر. لطفاً دوباره تلاش کنید." };
  }

  // ---------- ورود خودکار ----------
  const supabase = await createClient();
  const { error: signErr } = await supabase.auth.signInWithPassword({ email: finalEmail, password });
  if (signErr) {
    return { error: "ثبت نام انجام شد اما ورود خودکار ناموفق بود. لطفاً از تب ورود با موبایل و رمز وارد شوید." };
  }

  redirect("/");
}