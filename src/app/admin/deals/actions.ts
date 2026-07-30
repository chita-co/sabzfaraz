"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleDealsEnabled(enabled: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("site_settings")
    .update({ deals_enabled: enabled })
    .eq("id", 1);
  if (error) return { error: error.message };
  revalidatePath("/admin/deals");
  revalidatePath("/");
  return { success: true };
}

export async function toggleProductDeal(productId: string, isDeal: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ is_deal: isDeal })
    .eq("id", productId);
  if (error) return { error: error.message };
  revalidatePath("/admin/deals");
  revalidatePath("/");
  revalidatePath("/deals");
  return { success: true };
}