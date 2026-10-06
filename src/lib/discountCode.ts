import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function consumeDiscountCode(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  codeId: string,
  orderTotal: number,
  orderId: string
): Promise<{ error: string | null; discountAmount: number }> {
  const { data, error } = await supabase.rpc("consume_discount_code_for_order", {
    p_code_id: codeId,
    p_user_id: userId,
    p_order_total: orderTotal,
    p_order_id: orderId,
  });
  if (error) return { error: error.message, discountAmount: 0 };
  const result = data as { success?: boolean; error?: string; discountAmount?: number };
  if (result.error) return { error: result.error, discountAmount: 0 };

  const discountAmount = result.discountAmount ?? 0;

  // چون RLS روی جدول orders فقط به ادمین اجازه‌ی UPDATE می‌دهد،
  // از admin client استفاده می‌کنیم تا مبلغ تخفیف واقعاً ذخیره شود.
  const admin = createAdminClient();
  await admin
    .from("orders")
    .update({ discount_code_amount: discountAmount })
    .eq("id", orderId);

  return { error: null, discountAmount };
}


// بازگرداندن کد تخفیف مصرف‌شده‌ی یک سفارش (هنگام پرداخت ناموفق/لغو سفارش).
// ایدمپوتنت است و هیچ‌وقت خطا پرت نمی‌کند تا مسیر اصلی را خراب نکند.
export async function refundDiscountCode(orderId: string): Promise<void> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.rpc("refund_discount_code_for_order", { p_order_id: orderId });
    if (error) console.error("خطا در بازگشت کد تخفیف:", error.message);
  } catch (e) {
    console.error("خطا در بازگشت کد تخفیف:", e);
  }
}