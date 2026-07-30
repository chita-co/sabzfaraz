"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateUserRole(userId: string, role: "USER" | "ADMIN") {
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) return { error: "خطا: " + error.message };
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/users");
  return { success: true };
}

export async function createUserByAdmin(formData: FormData) {
  const fullName = formData.get("fullName") as string;
  const phone = formData.get("phone") as string;
  const email = ((formData.get("email") as string) || "").trim();
  const password = formData.get("password") as string;
  const role = formData.get("role") as string;

  if (!/^09\d{9}$/.test(phone)) {
    return { error: "شماره موبایل معتبر نیست. مثال: 09123456789" };
  }

  const adminClient = createAdminClient();

  const { data: existing } = await adminClient.from("profiles").select("id").eq("phone", phone).maybeSingle();
  if (existing) return { error: "این شماره موبایل قبلاً ثبت شده است." };

  const finalEmail = email || `${phone}@sabzfaraz-users.ir`;

  const { data: created, error } = await adminClient.auth.admin.createUser({
    email: finalEmail,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, phone },
  });

  if (error || !created.user) {
    return { error: "خطا در ساخت کاربر: " + (error?.message ?? "") };
  }

  if (role === "ADMIN") {
    await adminClient.from("profiles").update({ role: "ADMIN" }).eq("id", created.user.id);
  }

  revalidatePath("/admin/users");
  redirect("/admin/users");
}