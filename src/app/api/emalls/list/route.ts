import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const ALLOWED_ITEM_PER_PAGE = [10, 20, 50, 100];

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const rawItemPerPage = Number(searchParams.get("item_per_page")) || 50;
  const itemPerPage = ALLOWED_ITEM_PER_PAGE.includes(rawItemPerPage)
    ? rawItemPerPage
    : 50;

  const supabase = await createClient();

  const from = (page - 1) * itemPerPage;
  const to = from + itemPerPage - 1;

  const {
    data: products,
    count,
    error,
  } = await supabase
    .from("products")
    .select(
      "id, sku, name, price, discount_price, stock, images, slug, brand, colors, category:categories!products_category_id_fkey(name)",
      { count: "exact" }
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  const mappedProducts = (products ?? []).map((p) => {
    let color: string | null = null;
    if (Array.isArray(p.colors) && p.colors.length > 0) {
      const first = p.colors[0];
      if (typeof first === "object" && first !== null && "name" in first) {
        color = (first as { name: string }).name;
      } else if (typeof first === "string") {
        color = first;
      }
    }

    const categoryData = p.category as
      | { name?: string }
      | { name: string }[]
      | null;
    const categoryName = Array.isArray(categoryData)
      ? categoryData[0]?.name ?? ""
      : categoryData?.name ?? "";

    return {
      title: p.name,
      id: p.sku ?? p.id,
      price: p.discount_price ?? p.price,
      old_price: p.discount_price ? p.price : null,
      category: categoryName,
      image: p.images?.[0] ?? "",
      is_available: p.stock === null || p.stock > 0,
      url: `${origin}/products/${p.slug}`,
      color,
      guarantee: null,
    };
  });

  const totalItems = count ?? 0;
  const pagesCount = Math.ceil(totalItems / itemPerPage);

  return NextResponse.json(
    {
      success: true,
      products: mappedProducts,
      total_items: totalItems,
      pages_count: pagesCount,
      item_per_page: itemPerPage,
      page_num: page,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
      },
    }
  );
}