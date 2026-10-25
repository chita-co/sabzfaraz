"use server";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

function validate(minGrams: number, maxGrams: number, cost: number): string | null {
  if (![minGrams, maxGrams, cost].every((n) => Number.isFinite(n))) return "مقادیر واردشده معتبر نیست.";
  if (minGrams < 0 || maxGrams < 0 || cost < 0) return "مقادیر نمی‌توانند منفی باشند.";
  if (maxGrams < minGrams) return "«تا» نمی‌تواند کمتر از «از» باشد.";
  return null;
}

function refresh() {
  revalidatePath("/admin/packaging");
  revalidatePath("/checkout");
}

export async function addPackagingTier(minGrams: number, maxGrams: number, cost: number) {
  await requireAdmin();
  const invalid = validate(minGrams, maxGrams, cost);
  if (invalid) return { error: invalid };
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("packaging_weight_tiers")
    .insert({ min_weight_grams: Math.round(minGrams), max_weight_grams: Math.round(maxGrams), cost: Math.round(cost) })
    .select("id, min_weight_grams, max_weight_grams, cost")
    .single();
  if (error || !data) return { error: error?.message ?? "خطا در ثبت بازه" };
  refresh();
  return { success: true as const, tier: data };
}

export async function updatePackagingTier(id: string, minGrams: number, maxGrams: number, cost: number) {
  await requireAdmin();
  const invalid = validate(minGrams, maxGrams, cost);
  if (invalid) return { error: invalid };
  const admin = createAdminClient();
  const { error } = await admin
    .from("packaging_weight_tiers")
    .update({ min_weight_grams: Math.round(minGrams), max_weight_grams: Math.round(maxGrams), cost: Math.round(cost) })
    .eq("id", id);
  if (error) return { error: error.message };
  refresh();
  return { success: true as const };
}

export async function deletePackagingTier(id: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("packaging_weight_tiers").delete().eq("id", id);
  if (error) return { error: error.message };
  refresh();
  return { success: true as const };
}