"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleStockEnabled(enabled: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("site_settings").update({ stock_enabled: enabled }).eq("id", 1);
  if (error) return { error: error.message };
  revalidatePath("/admin/stock");
  revalidatePath("/");
  return { success: true };
}

export async function toggleProductStock(productId: string, isStock: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("products").update({ is_stock: isStock }).eq("id", productId);
  if (error) return { error: error.message };
  revalidatePath("/admin/stock");
  revalidatePath("/");
  revalidatePath("/stock");
  return { success: true };
}