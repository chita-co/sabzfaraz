"use server";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function deleteCartItemAction(id: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("cart_items").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/carts");
  return { success: true };
}

export async function deleteUserCartAction(userId: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("cart_items").delete().eq("user_id", userId);
  if (error) return { error: error.message };
  revalidatePath("/admin/carts");
  return { success: true };
}

export async function deleteStaleCartsAction(daysOld: number) {
  await requireAdmin();
  const admin = createAdminClient();
  const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await admin.from("cart_items").delete().lt("updated_at", cutoff).select("id");
  if (error) return { error: error.message };
  revalidatePath("/admin/carts");
  return { success: true, count: data?.length ?? 0 };
}