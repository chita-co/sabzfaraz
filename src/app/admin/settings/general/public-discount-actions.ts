"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { randomBytes } from "crypto";

// بدون حروف/عدد شبیه‌به‌هم (O، 0، I، 1) تا هنگام تایپ کد اشتباه نشه
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 4;

function generatePublicCode(): string {
  const bytes = randomBytes(CODE_LENGTH);
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) code += CODE_CHARS[bytes[i] % CODE_CHARS.length];
  return code;
}

export async function createPublicDiscountCode(percent: number, validDays: number, maxUses: number) {
  if (!Number.isFinite(percent) || percent <= 0 || percent > 100) {
    return { error: "درصد تخفیف باید بین ۱ تا ۱۰۰ باشد." };
  }
  if (!Number.isFinite(validDays) || validDays <= 0) {
    return { error: "مدت اعتبار باید عدد مثبت باشد." };
  }
  if (!Number.isInteger(maxUses) || maxUses <= 0) {
    return { error: "تعداد دفعات مجاز استفاده باید عدد صحیح مثبت باشد." };
  }

  const admin = createAdminClient();
  const expiresAt = new Date(Date.now() + validDays * 86400000).toISOString();

  let code = "";
  let inserted = false;
  for (let attempt = 0; attempt < 5 && !inserted; attempt++) {
    code = generatePublicCode();
    const { error } = await admin.from("discount_codes").insert({
      code,
      type: "PERCENT",
      value: percent,
      max_uses: maxUses,
      user_id: null,
      expires_at: expiresAt,
    });
    if (!error) inserted = true;
    else if (!error.message.toLowerCase().includes("duplicate")) {
      return { error: "خطا در ساخت کد تخفیف: " + error.message };
    }
  }
  if (!inserted) return { error: "ساخت کد تخفیف ناموفق بود، دوباره تلاش کنید." };

  return { success: true, code, percent, validDays, maxUses };
}