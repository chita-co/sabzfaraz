// src/lib/identity.ts
// ابزارهای داخلی سرور برای مدیریت مالکیت کد ملی بین حساب‌ها (بدون "use server")
import { createAdminClient } from "@/lib/supabase/admin";

/** حسابی که اکنون این کد ملی را دارد (به‌جز excludeUserId) */
export async function findNationalIdHolder(nationalId: string, excludeUserId?: string) {
  const admin = createAdminClient();
  let q = admin.from("profiles").select("id, identity_verified").eq("national_id", nationalId);
  if (excludeUserId) q = q.neq("id", excludeUserId);
  const { data } = await q.limit(1).maybeSingle();
  return (data as { id: string; identity_verified: boolean } | null) ?? null;
}

/**
 * آزاد کردن کد ملیِ ثبت‌شده برای حسابِ «احراز نشده».
 * فقط وقتی صدا زده می‌شود که مالک واقعی با استعلام زوهال اثبات شده باشد.
 */
export async function releaseUnverifiedNationalId(holderId: string, nationalId: string) {
  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({ national_id: null })
    .eq("id", holderId)
    .eq("national_id", nationalId)
    .eq("identity_verified", false);
}