import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PRODUCT_LIST_FIELDS } from "@/lib/productFields";
import { getCategoryProducts } from "@/lib/categories/categoryProducts";

const ALLOWED_PAGE_SIZES = [20, 50, 100];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode") ?? "all";
  const categoryId = searchParams.get("categoryId") ?? "";
  const sort = searchParams.get("sort") ?? "newest";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSizeParam = Number(searchParams.get("pageSize"));
  const pageSize = ALLOWED_PAGE_SIZES.includes(pageSizeParam) ? pageSizeParam : 20;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const catIds = mode === "category" && categoryId ? categoryId.split(",").filter(Boolean) : [];

  let products: Record<string, unknown>[] = [];
  let count = 0;

  if (catIds.length > 0) {
    const r = await getCategoryProducts(supabase, {
      categoryIds: catIds,
      sort,
      page,
      pageSize,
      fields: PRODUCT_LIST_FIELDS,
    });
    products = r.products;
    count = r.count;
  } else {
    const col =
      sort === "price_asc" || sort === "price_desc"
        ? "effective_price"
        : sort === "popular"
        ? "rating_avg"
        : "created_at";
    const asc = sort === "price_asc";
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const base = supabase
      .from("products")
      .select(PRODUCT_LIST_FIELDS, { count: "exact" })
      .eq("is_active", true);
    const filtered =
      mode === "newest"
        ? base.eq("show_in_newest", true)
        : mode === "popular"
        ? base.eq("is_popular", true)
        : base;
    const r = await filtered.order(col, { ascending: asc }).range(from, to);
    products = (r.data ?? []) as unknown as Record<string, unknown>[];
    count = r.count ?? 0;
  }

  let wishlistIds: string[] = [];
  if (user && products.length > 0) {
    const { data: wishRows } = await supabase
      .from("wishlists")
      .select("product_id")
      .eq("user_id", user.id)
      .in("product_id", products.map((p) => p.id as string));
    wishlistIds = (wishRows ?? []).map((w) => w.product_id);
  }

  return NextResponse.json({ products, count, wishlistIds });
}