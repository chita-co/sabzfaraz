// src/lib/categories/categoryProducts.ts
import type { createClient } from "@/lib/supabase/server";

type Sb = Awaited<ReturnType<typeof createClient>>;

export async function getCategoryProducts(
  supabase: Sb,
  opts: { categoryIds: string[]; sort: string; page: number; pageSize: number; fields: string }
): Promise<{ products: Record<string, unknown>[]; count: number }> {
  const { categoryIds, sort, page, pageSize, fields } = opts;
  if (categoryIds.length === 0) return { products: [], count: 0 };

  const sortKey =
    sort === "price_asc" || sort === "price_desc" ? "effective_price" : sort === "popular" ? "rating_avg" : "created_at";
  const sortAsc = sort === "price_asc";

  const { data: pageRows, error: pageErr } = await supabase.rpc("category_page", {
    cat_ids: categoryIds,
    sort_key: sortKey,
    sort_asc: sortAsc,
    page_size: pageSize,
    page_offset: (page - 1) * pageSize,
  });
  if (pageErr) {
    console.error("[categoryProducts] rpc error:", pageErr);
    return { products: [], count: 0 };
  }

  const rows = (pageRows ?? []) as { id: string; total: number | string }[];
  const count = rows.length > 0 ? Number(rows[0].total) : 0;
  const ids = rows.map((r) => r.id);
  if (ids.length === 0) return { products: [], count };

  const { data, error } = await supabase.from("products").select(fields).in("id", ids);
  if (error) {
    console.error("[categoryProducts] list error:", error);
    return { products: [], count };
  }

  // ترتیب خروجی همان ترتیب تابع SQL است
  const list = (data ?? []) as unknown as Record<string, unknown>[];
  const byId = new Map<string, Record<string, unknown>>();
  for (const row of list) {
    byId.set(String(row.id), row);
  }
  const products = ids
    .map((id) => byId.get(id))
    .filter((p): p is Record<string, unknown> => Boolean(p));
  return { products, count };
}