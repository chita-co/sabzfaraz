"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications";

const MAX_AMOUNT = 500_000_000; // سقف هر عملیات (تومان) — داخل دیتابیس هم همین سقف چک می‌شود
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type AdjustResult =
  | { success: true; duplicate?: boolean; adminBalance: number; userBalance: number; ref?: string }
  | { error: string };

// افزودن یا کسر دستی مبلغ از کیف پول یک کاربر.
// هویت ادمین فقط از سشن سمت سرور خوانده می‌شود؛ از کلاینت فقط (کاربر، نوع عملیات، مبلغ، دلیل، کلید یکتا) می‌آید
// و کل جابه‌جایی پول داخل یک تابع اتمیک دیتابیس (admin_adjust_wallet) انجام می‌شود.
export async function adjustUserWallet(input: unknown): Promise<AdjustResult> {
  let adminUser: { id: string };
  try {
    adminUser = await requireAdmin();
  } catch {
    return { error: "دسترسی غیرمجاز." };
  }

  const raw = (input ?? {}) as Record<string, unknown>;
  const targetUserId = typeof raw.targetUserId === "string" ? raw.targetUserId : "";
  const action = raw.action === "ADD" || raw.action === "DEDUCT" ? raw.action : null;
  const amount = typeof raw.amount === "number" ? raw.amount : NaN;
  const reason = typeof raw.reason === "string" ? raw.reason.trim().slice(0, 200) : "";
  const idempotencyKey = typeof raw.idempotencyKey === "string" ? raw.idempotencyKey : "";

  if (!UUID_RE.test(targetUserId)) return { error: "کاربر نامعتبر است." };
  if (!UUID_RE.test(idempotencyKey)) return { error: "درخواست نامعتبر است. صفحه را رفرش کنید." };
  if (!action) return { error: "نوع عملیات نامعتبر است." };
  if (!Number.isSafeInteger(amount) || amount <= 0) return { error: "مبلغ باید عدد صحیح و بزرگ‌تر از صفر باشد." };
  if (amount > MAX_AMOUNT) return { error: `سقف مبلغ هر عملیات ${MAX_AMOUNT.toLocaleString("fa-IR")} تومان است.` };
  if (reason.length < 3) return { error: "ثبت دلیل عملیات الزامی است." };
  if (targetUserId === adminUser.id) return { error: "انتقال به کیف پول خودتان مجاز نیست." };

  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "").slice(0, 100) || null;
  const userAgent = (h.get("user-agent") || "").slice(0, 300) || null;

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("admin_adjust_wallet", {
    p_admin_id: adminUser.id,
    p_target_id: targetUserId,
    p_action: action,
    p_amount: amount,
    p_reason: reason,
    p_idempotency_key: idempotencyKey,
    p_ip: ip,
    p_user_agent: userAgent,
  });

  if (error) {
    console.error("خطا در admin_adjust_wallet:", error.message);
    return { error: "خطا در ثبت عملیات. دوباره تلاش کنید." };
  }

  const res = data as { success?: boolean; error?: string; duplicate?: boolean; adminBalance?: number; userBalance?: number; ref?: string } | null;
  if (!res || res.error || !res.success) return { error: res?.error ?? "خطا در ثبت عملیات." };

  if (!res.duplicate) {
    try {
      await createNotification(
        targetUserId,
        action === "ADD" ? "اعتبار کیف پول شما افزایش یافت 💰" : "کسر از کیف پول",
        action === "ADD"
          ? `مبلغ ${amount.toLocaleString("fa-IR")} تومان توسط مدیریت به کیف پول شما اضافه شد.`
          : `مبلغ ${amount.toLocaleString("fa-IR")} تومان توسط مدیریت از کیف پول شما کسر شد.`
      );
    } catch (e) {
      console.error("خطا در ارسال اعلان تغییر کیف پول:", e);
    }
  }

  revalidatePath("/admin/finance/wallets");
  revalidatePath("/admin/finance/wallet-transactions");
  revalidatePath("/admin/finance/wallet-income");
  revalidatePath("/profile/wallet");

  return {
    success: true,
    duplicate: res.duplicate,
    adminBalance: Number(res.adminBalance ?? 0),
    userBalance: Number(res.userBalance ?? 0),
    ref: res.ref,
  };
}