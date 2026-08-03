import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/shop/ProductCard";
import ProductSortSelect from "@/components/shop/ProductSortSelect";
import Pagination from "@/components/shop/Pagination";
import PageSizeSelect from "@/components/shop/PageSizeSelect";
import GalaxyBackground from "@/components/backgrounds/GalaxyBackground";
import { Product } from "@/types";

const ALLOWED_PAGE_SIZES = [20, 50, 100];

export default async function AllProductsPage({
  searchParams,
}: { searchParams: Promise<{ sort?: string; page?: string; pageSize?: string }> }) {
  const { sort = "newest", page: pageParam, pageSize: pageSizeParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const pageSize = ALLOWED_PAGE_SIZES.includes(Number(pageSizeParam)) ? Number(pageSizeParam) : 20;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase.from("products").select("*", { count: "exact" }).eq("is_active", true);
  if (sort === "price_asc") query = query.order("effective_price", { ascending: true });
  else if (sort === "price_desc") query = query.order("effective_price", { ascending: false });
  else if (sort === "popular") query = query.order("rating_avg", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data: products, count } = await query.range(from, to);
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / pageSize));

  let wishlistIds = new Set<string>();
  if (user) {
    const { data: wishRows } = await supabase.from("wishlists").select("product_id").eq("user_id", user.id);
    wishlistIds = new Set((wishRows ?? []).map((w) => w.product_id));
  }

  return (
    <>
      <GalaxyBackground />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
          <h1 className="text-xl font-bold text-white">همه محصولات</h1>
          <ProductSortSelect />
        </div>
        <p className="text-sm text-gray-300 mb-6">{(count ?? 0).toLocaleString("fa-IR")} محصول</p>

        {products && products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {(products as Product[]).map((product) => (
                <ProductCard key={product.id} product={product} isWishlisted={wishlistIds.has(product.id)} />
              ))}
            </div>
            <div className="flex items-center justify-between flex-wrap gap-3 mt-6">
              <PageSizeSelect theme="dark" />
              <Pagination basePath="/products" currentPage={page} totalPages={totalPages} extraParams={{ sort, pageSize: String(pageSize) }} theme="dark" />
            </div>
          </>
        ) : (
          <p className="text-gray-300">محصولی یافت نشد.</p>
        )}
      </div>
    </>
  );
}