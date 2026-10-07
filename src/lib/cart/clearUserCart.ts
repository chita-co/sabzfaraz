// src/lib/cart/clearUserCart.ts
// پاک‌کردن سبد خرید یک کاربر — فقط برای استفاده‌ی داخلی سرور (چک‌اوت و callback پرداخت).
// عمداً "use server" ندارد تا به‌عنوان اکشن عمومی قابل فراخوانی از مرورگر نباشد.
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function clearUserCart(userId: string) {
  const admin = createAdminClient();
  const { error } = await admin.from("cart_items").delete().eq("user_id", userId);
  if (error) return { error: error.message };
  revalidatePath("/admin/carts");
  return { success: true };
}