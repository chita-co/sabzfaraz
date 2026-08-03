"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function restockProduct(productId: string, quantity: number) {
  if (quantity <= 0) return { error: "تعداد باید بزرگ‌تر از صفر باشد." };
  const supabase = await createClient();
  const { error } = await supabase.from("products").update({ stock: quantity }).eq("id", productId);
  if (error) return { error: error.message };
  revalidatePath("/admin/out-of-stock");
  revalidatePath("/admin/products");
  revalidatePath("/");
  return { success: true };
}