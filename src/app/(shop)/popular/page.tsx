import { createClient } from "@/lib/supabase/server";
import ProductSortSelect from "@/components/shop/ProductSortSelect";
import ProductListClient from "@/components/shop/ProductListClient";
import GalaxyBackground from "@/components/backgrounds/GalaxyBackground";

const ALLOWED_PAGE_SIZES = [20, 50, 100];

export default async function PopularProductsPage({
  searchParams,
}: { searchParams: Promise<{ sort?: string; page?: string; pageSize?: string }> }) {
  const { sort = "newest", page: pageParam, pageSize: pageSizeParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const pageSize = ALLOWED_PAGE_SIZES.includes(Number(pageSizeParam)) ? Number(pageSizeParam) : 20;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase.from("products").select("*", { count: "exact" }).eq("is_active", true).eq("is_popular", true);
  if (sort === "price_asc") query = query.order("effective_price", { ascending: true });
  else if (sort === "price_desc") query = query.order("effective_price", { ascending: false });
  else if (sort === "popular") query = query.order("rating_avg", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data: products, count } = await query.range(from, to);

  let wishlistIds: string[] = [];
  if (user && products && products.length > 0) {
    const { data: wishRows } = await supabase.from("wishlists").select("product_id").eq("user_id", user.id).in("product_id", products.map((p) => p.id));
    wishlistIds = (wishRows ?? []).map((w) => w.product_id);
  }

  return (
    <>
      <GalaxyBackground />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
          <h1 className="text-xl font-bold text-white">محصولات پرطرفدار</h1>
          <ProductSortSelect />
        </div>
        <p className="text-sm text-gray-300 mb-6">{(count ?? 0).toLocaleString("fa-IR")} محصول</p>

        <ProductListClient mode="popular" sort={sort} initialProducts={products ?? []} initialCount={count ?? 0} initialPage={page} initialPageSize={pageSize} initialWishlistIds={wishlistIds} basePath="/popular" />
      </div>
    </>
  );
}