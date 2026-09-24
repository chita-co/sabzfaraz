"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function getLatestPrices(productIds: string[]) {
  if (productIds.length === 0) return [];
  const admin = createAdminClient();

  const [productsRes, tiersRes] = await Promise.all([
    admin.from("products").select("id, price, discount_price, stock").in("id", productIds),
    admin
      .from("product_quantity_tiers")
      .select("product_id, min_qty, max_qty, unit_price")
      .in("product_id", productIds)
      .order("min_qty", { ascending: true }),
  ]);

  const tiers = tiersRes.data ?? [];
  const tiersOk = !tiersRes.error;

  return (productsRes.data ?? []).map((p) => ({
    productId: p.id,
    price: p.price,
    discountPrice: p.discount_price,
    stock: p.stock,
    // اگر خواندن قیمت پلکانی خطا داد undefined می‌فرستیم تا قیمت‌های پلکانی قبلی سبد پاک نشوند
    quantityTiers: tiersOk
      ? tiers
          .filter((t) => t.product_id === p.id)
          .map((t) => ({ min_qty: Number(t.min_qty), max_qty: Number(t.max_qty), unit_price: Number(t.unit_price) }))
      : undefined,
  }));
}