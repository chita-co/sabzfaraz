"use server";

import { createClient } from "@/lib/supabase/server";

export async function validateDiscountCode(code: string, orderTotal: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ابتدا وارد حساب کاربری خود شوید." };
  if (!code.trim()) return { error: "کد تخفیف را وارد کنید." };

  const { data, error } = await supabase.rpc("validate_discount_code", {
    p_code: code.trim(),
    p_user_id: user.id,
    p_order_total: orderTotal,
  });
  if (error) return { error: error.message };
  return data as { success?: boolean; error?: string; codeId?: string; discountAmount?: number };
}