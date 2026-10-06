import { createAdminClient } from "@/lib/supabase/admin";

// بازگرداندن مبلغ پرداخت‌شده از کیف پول برای سفارش ناموفق/لغو‌شده (فقط سفارش‌های پرداخت‌نشده).
// ایدمپوتنت است و هیچ‌وقت خطا پرت نمی‌کند تا مسیر اصلی را خراب نکند.
export async function refundWalletForOrder(orderId: string): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("refund_wallet_for_order", { p_order_id: orderId });
    if (error) {
      console.error("خطا در بازگشت پول کیف پول:", error.message);
      return;
    }
    const r = data as { refunded?: number; adminReverseFailed?: boolean } | null;
    if (r?.adminReverseFailed) {
      console.warn("بازگشت مشتری انجام شد ولی برگشت دریافتی ادمین ناموفق بود. سفارش:", orderId);
    }
  } catch (e) {
    console.error("خطا در بازگشت پول کیف پول:", e);
  }
}