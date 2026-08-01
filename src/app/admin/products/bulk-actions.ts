"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface BulkChanges {
  price?: number;
  discountPrice?: number | null;
  brand?: string | null;
  categoryId?: string;
  isActive?: boolean;
  weightGrams?: number | null;
}
interface BulkTier { minQty: number; maxQty: number; unitPrice: number; }

export async function bulkUpdateProducts(ids: string[], changes: BulkChanges, quantityTiers?: BulkTier[]) {
  const supabase = await createClient();

  const updatePayload: Record<string, unknown> = {};
  if (changes.price !== undefined) updatePayload.price = changes.price;
  if (changes.discountPrice !== undefined) updatePayload.discount_price = changes.discountPrice;
  if (changes.brand !== undefined) updatePayload.brand = changes.brand;
  if (changes.categoryId !== undefined) updatePayload.category_id = changes.categoryId;
  if (changes.isActive !== undefined) updatePayload.is_active = changes.isActive;
  if (changes.weightGrams !== undefined) updatePayload.weight_grams = changes.weightGrams;

  if (Object.keys(updatePayload).length > 0) {
    const { error } = await supabase.from("products").update(updatePayload).in("id", ids);
    if (error) return { error: error.message };
  }

  if (quantityTiers) {
    await supabase.from("product_quantity_tiers").delete().in("product_id", ids);
    if (quantityTiers.length > 0) {
      const rows = ids.flatMap((productId) =>
        quantityTiers.map((t) => ({ product_id: productId, min_qty: t.minQty, max_qty: t.maxQty, unit_price: t.unitPrice }))
      );
      const { error } = await supabase.from("product_quantity_tiers").insert(rows);
      if (error) return { error: error.message };
    }
  }

  revalidatePath("/admin/products");
  revalidatePath("/");
  return { success: true };
}