"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";

async function bumpCaches(productId: string) {
  updateTag("products");
  revalidatePath("/");
  revalidatePath("/bubble-deals");
  const admin = createAdminClient();
  const { data } = await admin.from("products").select("slug").eq("id", productId).maybeSingle();
  if (data?.slug) revalidatePath(`/products/${data.slug}`);
}

export async function applyBubbleDeal(
  productId: string,
  price: number,
  durationMinutes: number
): Promise<{ success: true } | { error: string }> {
  await requireAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("apply_bubble_deal", {
    p_product_id: productId,
    p_price: Math.round(Number(price)),
    p_minutes: Math.round(Number(durationMinutes)),
  });
  if (error) return { error: "خطا در ثبت: " + error.message };
  const result = data as { ok?: boolean; error?: string } | null;
  if (!result?.ok) return { error: result?.error ?? "ثبت انجام نشد." };
  await bumpCaches(productId);
  return { success: true };
}

export async function endBubbleDeal(productId: string): Promise<{ success: true } | { error: string }> {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.rpc("end_bubble_deal", { p_product_id: productId });
  if (error) return { error: error.message };
  await bumpCaches(productId);
  return { success: true };
}