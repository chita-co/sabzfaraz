// src/lib/categories/productScope.ts
import { createPublicClient } from "@/lib/supabase/public";

// فیلتر OR برای محصولاتی که دسته‌ی اصلی‌شان در لیست است
// یا در product_categories (دسته‌های اضافی) به یکی از این دسته‌ها وصل‌اند
export async function productScopeFilter(categoryIds: string[]): Promise<string> {
  const ids = categoryIds.filter(Boolean);
  if (ids.length === 0) return "id.is.null";

  const { data } = await createPublicClient()
    .from("product_categories")
    .select("product_id")
    .in("category_id", ids);

  const extraIds = Array.from(new Set((data ?? []).map((r: { product_id: string }) => r.product_id)));

  const parts = [`category_id.in.(${ids.join(",")})`];
  if (extraIds.length > 0) parts.push(`id.in.(${extraIds.join(",")})`);
  return parts.join(",");
}