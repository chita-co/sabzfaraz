"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { randomBytes } from "crypto";
import { sendGroupDiscountSms } from "@/lib/sms";
import { revalidatePath } from "next/cache";


const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 4;

function generateBulkCode(): string {
  const bytes = randomBytes(CODE_LENGTH);
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) code += CODE_CHARS[bytes[i] % CODE_CHARS.length];
  return code;
}

export interface BulkDiscountResult {
  userId: string;
  name: string;
  success: boolean;
  code?: string;
  error?: string;
}

export async function issueBulkDiscountCodes(
  userIds: string[],
  percent: number,
  validDays: number
): Promise<{ error?: string; results?: BulkDiscountResult[] }> {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return { error: "هیچ کاربری انتخاب نشده است." };
  }
  if (!Number.isFinite(percent) || percent <= 0 || percent > 100) {
    return { error: "درصد تخفیف باید بین ۱ تا ۱۰۰ باشد." };
  }
  if (!Number.isFinite(validDays) || validDays <= 0) {
    return { error: "مدت اعتبار باید عدد مثبت باشد." };
  }

  const admin = createAdminClient();
  const expiresAt = new Date(Date.now() + validDays * 86400000).toISOString();
  const uniqueUserIds = Array.from(new Set(userIds));

  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("id, full_name, phone")
    .in("id", uniqueUserIds);

  if (profilesError) {
    return { error: "خطا در خواندن اطلاعات کاربران: " + profilesError.message };
  }

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const results: BulkDiscountResult[] = [];

  for (const userId of uniqueUserIds) {
    const profile = profileMap.get(userId);
    const name = profile?.full_name || "کاربر";

    let code = "";
    let inserted = false;
    let insertErrorMessage = "";
    for (let attempt = 0; attempt < 5 && !inserted; attempt++) {
      code = generateBulkCode();
      const { error } = await admin.from("discount_codes").insert({
        code,
        type: "PERCENT",
        value: percent,
        max_uses: 1,
        user_id: userId,
        expires_at: expiresAt,
      });
      if (!error) {
        inserted = true;
      } else if (error.message.toLowerCase().includes("duplicate")) {
        continue;
      } else {
        insertErrorMessage = error.message;
        break;
      }
    }

    if (!inserted) {
      results.push({
        userId, name, success: false,
        error: insertErrorMessage ? "خطا در ساخت کد: " + insertErrorMessage : "ساخت کد تخفیف پس از چند تلاش ناموفق بود.",
      });
      continue;
    }

    const phone = profile?.phone;
    if (!phone) {
      results.push({ userId, name, success: false, code, error: "کد ساخته شد ولی این کاربر شماره تلفن ثبت‌شده ندارد؛ پیامک ارسال نشد." });
      continue;
    }

    try {
      await sendGroupDiscountSms(phone, name, code, percent, validDays);
      results.push({ userId, name, success: true, code });
    } catch (e) {
      results.push({ userId, name, success: false, code, error: "کد ساخته شد ولی ارسال پیامک ناموفق بود: " + (e instanceof Error ? e.message : String(e)) });
    }
  }

  revalidatePath("/admin/users");
  return { results };
}