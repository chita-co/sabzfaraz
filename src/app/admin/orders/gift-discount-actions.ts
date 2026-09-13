"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { sendGiftDiscountSms } from "@/lib/sms";

// بدون حروف/عدد شبیه‌به‌هم (O، 0، I، 1) تا هنگام تایپ کد اشتباه نشه
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateGiftCode(): string {
  const bytes = randomBytes(6);
  let code = "";
  for (let i = 0; i < 6; i++) code += CODE_CHARS[bytes[i] % CODE_CHARS.length];
  return code;
}

export async function issueGiftDiscountCode(
  orderId: string,
  percent: number,
  validDays: number
) {
  if (!Number.isFinite(percent) || percent <= 0 || percent > 100) {
    return { error: "درصد تخفیف باید بین ۱ تا ۱۰۰ باشد." };
  }
  if (!Number.isFinite(validDays) || validDays <= 0) {
    return { error: "مدت اعتبار باید عدد مثبت باشد." };
  }

  const admin = createAdminClient();

  const { data: order } = await admin
    .from("orders")
    .select("user_id, profile:profiles(full_name, phone), address:addresses(phone)")
    .eq("id", orderId)
    .single();

  if (!order?.user_id) return { error: "کاربر این سفارش پیدا نشد." };

  const expiresAt = new Date(Date.now() + validDays * 86400000).toISOString();

  let code = "";
  let inserted = false;
  for (let attempt = 0; attempt < 5 && !inserted; attempt++) {
    code = generateGiftCode();
    const { error } = await admin.from("discount_codes").insert({
      code,
      type: "PERCENT",
      value: percent,
      max_uses: 1,
      user_id: order.user_id,
      expires_at: expiresAt,
    });
    if (!error) inserted = true;
    else if (!error.message.toLowerCase().includes("duplicate")) {
      return { error: "خطا در ساخت کد تخفیف: " + error.message };
    }
  }
  if (!inserted) return { error: "ساخت کد تخفیف ناموفق بود، دوباره تلاش کنید." };

  const profile = order.profile as unknown as { full_name?: string; phone?: string } | null;
  const address = order.address as unknown as { phone?: string } | null;
  const phone = profile?.phone ?? address?.phone;

  if (phone) {
    try {
      await sendGiftDiscountSms(phone, profile?.full_name || "کاربر", code, percent, validDays);
    } catch (e) {
      console.error("خطا در ارسال پیامک کد تخفیف هدیه:", e);
    }
  }

  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true, code };
}