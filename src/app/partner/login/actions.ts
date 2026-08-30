"use server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyAllAdmins } from "@/lib/notifications";
import { sendSms } from "@/lib/sms";
import { redirect } from "next/navigation";

function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("0098")) {
    return "+" + digits.slice(2);
  }

  if (digits.startsWith("0")) {
    return "+98" + digits.slice(1);
  }

  if (digits.startsWith("98")) {
    return "+" + digits;
  }

  return "+" + digits;
}

export async function loginPartnerAction(phone: string, password: string) {
  const admin = createAdminClient();

  const { data: partner } = await admin
    .from("partners")
    .select("id")
    .eq("phone", phone.trim())
    .maybeSingle();

  if (!partner) return { error: "شماره موبایل یا رمز عبور اشتباه است." };

  const { data: authUserData } = await admin.auth.admin.getUserById(partner.id);
  const email = authUserData?.user?.email;

  if (!email) return { error: "خطا در یافتن حساب کاربری." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: "شماره موبایل یا رمز عبور اشتباه است." };

  redirect("/partner");
}

export async function partnerSignOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/partner/login");
}

interface RegisterInput {
  businessName: string;
  contactName: string;
  phone: string;
  email: string;
  nationalId: string;
  address: string;
  logoUrl: string | null;
  bio: string;
  shebaNumber: string;
  cardNumber: string;
  password: string;
  categoryIds: string[];
  termsAccepted: boolean;
}

export async function registerPartnerAction(input: RegisterInput) {
  if (!input.termsAccepted) return { error: "برای ثبت‌نام باید قوانین همکاری را بپذیرید." };
  if (!input.businessName.trim() || !input.phone.trim() || !input.address.trim() || !input.nationalId.trim() || !input.shebaNumber.trim()) {
    return { error: "همه‌ی فیلدهای اجباری را تکمیل کنید." };
  }
  if (input.password.length < 6) return { error: "رمز عبور باید حداقل ۶ کاراکتر باشد." };

  const admin = createAdminClient();

  const { data: existingPartner } = await admin
    .from("partners")
    .select("id")
    .eq("phone", input.phone.trim())
    .maybeSingle();

  if (existingPartner) {
    return { error: "همکاری با این شماره موبایل قبلاً ثبت‌نام کرده است." };
  }

  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("phone", input.phone.trim())
    .maybeSingle();

  const email = input.email?.trim() || `${input.phone.trim()}@partner.sabzfaraz-users.ir`;

  let userId = existingProfile?.id ?? null;

  if (!userId) {
    const { data: created, error: authError } = await admin.auth.admin.createUser({
      email,
      phone: toE164(input.phone.trim()),
      password: input.password,
      email_confirm: true,
      phone_confirm: true,
    });

    if (authError || !created.user) {
      return { error: "خطا در ساخت حساب: " + (authError?.message ?? "") };
    }

    userId = created.user.id;

    await admin
      .from("profiles")
      .upsert({ id: userId, full_name: input.businessName.trim() }, { onConflict: "id" })
      .select()
      .maybeSingle();
  }

  if (!userId) return { error: "خطا در ساخت حساب." };

  const { error: insertError } = await admin.from("partners").insert({
    id: userId,
    business_name: input.businessName.trim(),
    contact_name: input.contactName.trim() || null,
    phone: input.phone.trim(),
    email,
    national_id: input.nationalId.trim(),
    address: input.address.trim(),
    logo_url: input.logoUrl,
    bio: input.bio.trim() || null,
    sheba_number: input.shebaNumber.trim(),
    card_number: input.cardNumber.trim() || null,
    status: "PENDING_REVIEW",
  });

  if (insertError) {
    if (!existingProfile && userId) {
      await admin.auth.admin.deleteUser(userId);
    }
    return { error: "خطا در ثبت اطلاعات: " + insertError.message };
  }

  for (const categoryId of input.categoryIds) {
    await admin.from("partner_categories").insert({ partner_id: userId, category_id: categoryId });
  }

  try {
    await notifyAllAdmins("درخواست همکاری جدید 🤝", `«${input.businessName}» درخواست همکاری ثبت کرد و در انتظار بررسی است.`);
  } catch (e) { console.error(e); }

  try {
    await sendSms(input.phone.trim(), `سبزفراز\nثبت‌نام شما در پنل همکاران دریافت شد و پس از بررسی، نتیجه به شما اطلاع داده می‌شود.`);
  } catch (e) { console.error(e); }

  return { success: true };
}

// ---------- بازیابی رمز با پیامک ----------
export async function requestPasswordResetAction(phone: string) {
  const admin = createAdminClient();
  const { data: partner } = await admin.from("partners").select("id").eq("phone", phone.trim()).maybeSingle();
  if (!partner) return { error: "همکاری با این شماره موبایل یافت نشد." };

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  await admin.from("partner_password_resets").insert({
    phone: phone.trim(), code, expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  });

  try {
    await sendSms(phone.trim(), `سبزفراز\nکد بازیابی رمز عبور شما: ${code}\nاعتبار: ۱۰ دقیقه`);
  } catch (e) {
    console.error(e);
    return { error: "خطا در ارسال پیامک." };
  }
  return { success: true };
}

export async function confirmPasswordResetAction(phone: string, code: string, newPassword: string) {
  if (newPassword.length < 6) return { error: "رمز عبور باید حداقل ۶ کاراکتر باشد." };
  const admin = createAdminClient();

  const { data: resetRow } = await admin
    .from("partner_password_resets")
    .select("*").eq("phone", phone.trim()).eq("code", code).eq("used", false)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false }).limit(1).maybeSingle();

  if (!resetRow) return { error: "کد نامعتبر یا منقضی‌شده است." };

  const { data: partner } = await admin.from("partners").select("id").eq("phone", phone.trim()).single();
  if (!partner) return { error: "همکار یافت نشد." };

  await admin.auth.admin.updateUserById(partner.id, { password: newPassword });
  await admin.from("partner_password_resets").update({ used: true }).eq("id", resetRow.id);

  return { success: true };
}