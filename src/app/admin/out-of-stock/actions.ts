"use server";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath, updateTag } from "next/cache";

export async function restockProduct(productId: string, quantity: number) {
  await requireAdmin();
  if (quantity <= 0) return { error: "تعداد باید بزرگ‌تر از صفر باشد." };
  const supabase = await createClient();
  const { error } = await supabase.from("products").update({ stock: quantity }).eq("id", productId);
  if (error) return { error: error.message };
  // صفحه اختصاصی این محصول (ISR) هم رفرش بشه تا موجودی جدید فوراً روی سایت دیده بشه.
  const { data: slugRow } = await supabase.from("products").select("slug").eq("id", productId).single();
  revalidatePath("/admin/out-of-stock");
  revalidatePath("/admin/products");
  revalidatePath("/");
  updateTag("products");
  if (slugRow?.slug) revalidatePath(`/products/${slugRow.slug}`);
  return { success: true };
}