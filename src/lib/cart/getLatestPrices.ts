"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function getLatestPrices(productIds: string[]) {
  if (productIds.length === 0) return [];
  const admin = createAdminClient();
  const { data } = await admin.from("products").select("id, price, discount_price, stock").in("id", productIds);
  return (data ?? []).map((p) => ({
    productId: p.id,
    price: p.price,
    discountPrice: p.discount_price,
    stock: p.stock,
  }));
}