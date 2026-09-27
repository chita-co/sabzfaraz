// src/lib/shahkarCache.ts
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * چک می‌کند که آیا این جفت (موبایل + کدملی) قبلاً با موفقیت استعلام شده یا نه.
 * اگه یکی از این دو تغییر کنه، false برمی‌گردونه و باید دوباره استعلام بشه.
 */
export async function isShahkarVerified(mobile: string, nationalId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("shahkar_verifications")
    .select("id")
    .eq("mobile", mobile)
    .eq("national_id", nationalId)
    .maybeSingle();
  return !!data;
}

/**
 * نتیجه‌ی موفق استعلام را در cache ذخیره می‌کند.
 * اگر قبلاً ذخیره شده باشد، به خاطر unique constraint خطا نمی‌دهد (upsert).
 */
export async function saveShahkarVerification(mobile: string, nationalId: string): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("shahkar_verifications")
    .upsert(
      { mobile, national_id: nationalId },
      { onConflict: "mobile,national_id", ignoreDuplicates: true }
    );
}