"use server";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

function refresh() {
  revalidatePath("/admin/bulk-orders/shipping-options");
  revalidatePath("/bulk-order");
}

export async function createBulkShippingOption(name: string, price: number) {
  await requireAdmin();
  if (!name.trim()) return { error: "نام نحوه‌ی ارسال الزامی است." };
  if (!Number.isInteger(price) || price < 0) return { error: "مبلغ نامعتبر است." };
  const { error } = await createAdminClient()
    .from("bulk_shipping_options")
    .insert({ name: name.trim(), price });
  if (error) return { error: error.message };
  refresh();
  return { success: true };
}

export async function updateBulkShippingOptionPrice(id: string, price: number) {
  await requireAdmin();
  if (!Number.isInteger(price) || price < 0) return { error: "مبلغ نامعتبر است." };
  const { error } = await createAdminClient().from("bulk_shipping_options").update({ price }).eq("id", id);
  if (error) return { error: error.message };
  refresh();
  return { success: true };
}

export async function setBulkShippingOptionActive(id: string, active: boolean) {
  await requireAdmin();
  const { error } = await createAdminClient().from("bulk_shipping_options").update({ is_active: active }).eq("id", id);
  if (error) return { error: error.message };
  refresh();
  return { success: true };
}

export async function deleteBulkShippingOption(id: string) {
  await requireAdmin();
  const { error } = await createAdminClient().from("bulk_shipping_options").delete().eq("id", id);
  if (error) return { error: error.message };
  refresh();
  return { success: true };
}