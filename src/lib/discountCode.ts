import { createClient } from "@/lib/supabase/server";

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
  return { error: null, discountAmount: result.discountAmount ?? 0 };
}