"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function getLatestPrices(productIds: string[]) {
  if (productIds.length === 0) return [];
  const admin = createAdminClient();

  // حباب‌های منقضی‌شده قبل از خواندن قیمت‌ها برگردانده می‌شوند
  await admin.rpc("refresh_bubble_deals");

  const [productsRes, tiersRes] = await Promise.all([
    admin
      .from("products")
      .select(
        "id, price, discount_price, stock, flash_applied, flash_price, flash_stock, flash_base_discount_price, flash_ends_at"
      )
      .in("id", productIds),
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
    // موجودی واقعی کل محصول؛ سقف خرید سبد همین است (خرید بیشتر از حباب با قیمت عادی مجاز است)
    stock: p.stock,
    flashEndsAt: (p.flash_ends_at as string | null) ?? null,
    flashPrice: p.flash_applied ? (p.flash_price ?? null) : null,
    flashStock: p.flash_applied ? (p.flash_stock ?? null) : null,
    regularDiscount: p.flash_applied
      ? (p.flash_base_discount_price ?? null)
      : (p.discount_price ?? null),
    quantityTiers: tiersOk
      ? tiers
          .filter((t) => t.product_id === p.id)
          .map((t) => ({
            min_qty: Number(t.min_qty),
            max_qty: Number(t.max_qty),
            unit_price: Number(t.unit_price),
          }))
      : undefined,
  }));
}