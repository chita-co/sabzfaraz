"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addShippingRate(province: string, city: string | null, cost: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("shipping_rates").insert({ province, city, cost });
  if (error) {
    if (error.message.includes("duplicate")) return { error: "این استان/شهر قبلاً ثبت شده است." };
    return { error: error.message };
  }
  revalidatePath("/admin/shipping");
  return { success: true };
}

export async function updateShippingRate(id: string, cost: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("shipping_rates").update({ cost }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/shipping");
  return { success: true };
}

export async function deleteShippingRate(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("shipping_rates").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/shipping");
  return { success: true };
}

export async function updateDefaultShippingCost(cost: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("site_settings")
    .update({ default_shipping_cost: cost })
    .eq("id", 1);
  if (error) return { error: error.message };
  revalidatePath("/admin/shipping");
  return { success: true };
}