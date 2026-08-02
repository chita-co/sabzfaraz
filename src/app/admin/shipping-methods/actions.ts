"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createShippingMethod(name: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("shipping_methods").insert({ name });
  if (error) return { error: error.message };
  revalidatePath("/admin/shipping-methods");
  return { success: true };
}

export async function toggleShippingMethodActive(id: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("shipping_methods").update({ is_active: isActive }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/shipping-methods");
  return { success: true };
}

export async function deleteShippingMethod(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("shipping_methods").delete().eq("id", id);
  if (error) return { error: "خطا در حذف: " + error.message };
  revalidatePath("/admin/shipping-methods");
  return { success: true };
}

export async function addWeightTier(methodId: string, minGrams: number, maxGrams: number, cost: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("shipping_weight_tiers").insert({
    method_id: methodId, min_weight_grams: minGrams, max_weight_grams: maxGrams, cost,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/shipping-methods");
  return { success: true };
}

export async function updateWeightTier(id: string, minGrams: number, maxGrams: number, cost: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("shipping_weight_tiers")
    .update({ min_weight_grams: minGrams, max_weight_grams: maxGrams, cost })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/shipping-methods");
  return { success: true };
}

export async function deleteWeightTier(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("shipping_weight_tiers").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/shipping-methods");
  return { success: true };
}