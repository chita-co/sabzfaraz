"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function restockProduct(productId: string, quantity: number) {
  if (quantity <= 0) return { error: "تعداد باید بزرگ‌تر از صفر باشد." };
  const supabase = await createClient();
  const { error } = await supabase.from("products").update({ stock: quantity }).eq("id", productId);
  if (error) return { error: error.message };
  // صفحه اختصاصی این محصول (ISR) هم رفرش بشه تا موجودی جدید فوراً روی سایت دیده بشه.
  const { data: slugRow } = await supabase.from("products").select("slug").eq("id", productId).single();
  revalidatePath("/admin/out-of-stock");
  revalidatePath("/admin/products");
  revalidatePath("/");
  if (slugRow?.slug) revalidatePath(`/products/${slugRow.slug}`);
  return { success: true };
}