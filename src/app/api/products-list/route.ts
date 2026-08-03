import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  let query = supabase.from("products").select("*", { count: "exact" }).eq("is_active", true);

  if (mode === "newest") query = query.eq("show_in_newest", true);
  else if (mode === "popular") query = query.eq("is_popular", true);
  else if (mode === "category" && categoryId) query = query.eq("category_id", categoryId);

  if (sort === "price_asc") query = query.order("effective_price", { ascending: true });
  else if (sort === "price_desc") query = query.order("effective_price", { ascending: false });
  else if (sort === "popular") query = query.order("rating_avg", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data: products, count } = await query.range(from, to);

  let wishlistIds: string[] = [];
  if (user && products && products.length > 0) {
    const { data: wishRows } = await supabase
      .from("wishlists").select("product_id").eq("user_id", user.id)
      .in("product_id", products.map((p) => p.id));
    wishlistIds = (wishRows ?? []).map((w) => w.product_id);
  }

  return NextResponse.json({ products: products ?? [], count: count ?? 0, wishlistIds });
}