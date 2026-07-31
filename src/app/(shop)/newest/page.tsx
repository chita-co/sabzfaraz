import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/shop/ProductCard";
import ProductSortSelect from "@/components/shop/ProductSortSelect";
import Pagination from "@/components/shop/Pagination";
import GalaxyBackground from "@/components/backgrounds/GalaxyBackground";
import { Product } from "@/types";

const PAGE_SIZE = 20;

export default async function NewestProductsPage({
  searchParams,
}: { searchParams: Promise<{ sort?: string; page?: string }> }) {
  const { sort = "newest", page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase.from("products").select("*", { count: "exact" })
    .eq("is_active", true).eq("show_in_newest", true);

  if (sort === "price_asc") query = query.order("effective_price", { ascending: true });
  else if (sort === "price_desc") query = query.order("effective_price", { ascending: false });
  else if (sort === "popular") query = query.order("rating_avg", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data: products, count } = await query.range(from, to);
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

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
          <h1 className="text-xl font-bold text-white">جدیدترین محصولات</h1>
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
            <Pagination basePath="/newest" currentPage={page} totalPages={totalPages} extraParams={{ sort }} />
          </>
        ) : (
          <p className="text-gray-300">محصولی یافت نشد.</p>
        )}
      </div>
    </>
  );
}