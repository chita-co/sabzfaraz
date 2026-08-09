import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/shop/ProductCard";
import ProductSortSelect from "@/components/shop/ProductSortSelect";
import Pagination from "@/components/shop/Pagination";
import Breadcrumb from "@/components/shop/Breadcrumb"; // ← اضافه شد
import { Product } from "@/types";

const PAGE_SIZE = 20;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; page?: string }>;
}) {
  const { q, sort = "newest", page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let products: Product[] = [];
  let count = 0;

  if (q) {
    let query = supabase
      .from("products")
      .select("*", { count: "exact" })
      .eq("is_active", true)
      .ilike("name", `%${q}%`);

    if (sort === "price_asc") query = query.order("effective_price", { ascending: true });
    else if (sort === "price_desc") query = query.order("effective_price", { ascending: false });
    else if (sort === "popular") query = query.order("rating_avg", { ascending: false });
    else query = query.order("created_at", { ascending: false });

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, count: c } = await query.range(from, to);
    products = (data as Product[]) ?? [];
    count = c ?? 0;
  }

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  // بخش wishlist که قبلاً داشتید — کاملاً حفظ شده
  let wishlistIds = new Set<string>();
  if (user) {
    const { data: wishRows } = await supabase
      .from("wishlists")
      .select("product_id")
      .eq("user_id", user.id);
    wishlistIds = new Set((wishRows ?? []).map((w) => w.product_id));
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Breadcrumb اضافه‌شده */}
      <Breadcrumb
        theme="light"
        items={[{ label: q ? `نتایج جستجو برای «${q}»` : "جستجو" }]}
      />

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-xl font-bold text-gray-900">
          نتایج جستجو برای «{q}»
        </h1>
        {products.length > 0 && <ProductSortSelect />}
      </div>

      {products.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isWishlisted={wishlistIds.has(product.id)} // ← درست مثل قبل
              />
            ))}
          </div>
          <Pagination
            basePath="/search"
            currentPage={page}
            totalPages={totalPages}
            extraParams={{ q: q ?? "", sort }}
          />
        </>
      ) : (
        <p className="text-gray-500">محصولی با این نام پیدا نشد.</p>
      )}
    </div>
  );
}