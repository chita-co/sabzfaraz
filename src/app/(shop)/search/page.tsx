import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/shop/ProductCard";
import ProductSortSelect from "@/components/shop/ProductSortSelect";
import PageSizeSelect from "@/components/shop/PageSizeSelect";
import Pagination from "@/components/shop/Pagination";
import Breadcrumb from "@/components/shop/Breadcrumb";
import { Product } from "@/types";
import SimilarSearchSuggestions from "@/components/shop/SimilarSearchSuggestions";
import { PRODUCT_LIST_FIELDS } from "@/lib/productFields";

const ALLOWED_PAGE_SIZES = [20, 50, 100];
const MIN_PAGE_SIZE = 20;

type SearchRow = { product_id: string; total_count: number };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; page?: string; pageSize?: string }>;
}) {
  const { q, sort = "newest", page: pageParam, pageSize: pageSizeParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const pageSize = ALLOWED_PAGE_SIZES.includes(Number(pageSizeParam)) ? Number(pageSizeParam) : 20;
  const from = (page - 1) * pageSize;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const normalizedQ = q?.trim().replace(/\s+/g, " ") || "";

  let products: Product[] = [];
  let count = 0;
  let similarProducts: Product[] = [];

  if (normalizedQ) {
    const { data: ranked, error: rankError } = await supabase.rpc("search_products_fuzzy", {
      p_query: normalizedQ,
      p_sort: sort,
      p_limit: pageSize,
      p_offset: from,
    });

    if (!rankError && ranked) {
      const rows = ranked as SearchRow[];
      count = rows.length > 0 ? Number(rows[0].total_count) : 0;
      const ids = rows.map((r) => r.product_id);

      if (ids.length > 0) {
        const { data } = await supabase
          .from("products")
          .select(PRODUCT_LIST_FIELDS)
          .in("id", ids);
        const byId = new Map(((data ?? []) as unknown as Product[]).map((p) => [p.id, p]));
        // حفظ ترتیب رتبه‌بندی SQL
        products = ids.map((id) => byId.get(id)).filter((p): p is Product => Boolean(p));
      }
    } else {
      // فال‌بک: اگر تابع SQL هنوز نصب نشده، جست‌وجوی قبلی (حالا روی name و name_en)
      const safe = normalizedQ.replace(/[%_,()]/g, " ").trim();
      let query = supabase
        .from("products")
        .select(PRODUCT_LIST_FIELDS, { count: "exact" })
        .eq("is_active", true)
        .or(`name.ilike.%${safe}%,name_en.ilike.%${safe}%`);

      if (sort === "price_asc") query = query.order("effective_price", { ascending: true });
      else if (sort === "price_desc") query = query.order("effective_price", { ascending: false });
      else if (sort === "popular") query = query.order("rating_avg", { ascending: false });
      else query = query.order("created_at", { ascending: false });

      const { data, count: c } = await query.range(from, from + pageSize - 1);
      products = (data as unknown as Product[]) ?? [];
      count = c ?? 0;
    }

    // پیشنهاد «آیا منظور شما این موارد بود؟» فقط وقتی هیچ نتیجه‌ای نیست
    if (count === 0 && page === 1) {
      const { data: similar } = await supabase.rpc("search_products_similar", {
        p_query: normalizedQ,
        p_exclude_ids: [],
        p_limit: 8,
      });
      similarProducts = (similar as Product[]) ?? [];
    }
  }

  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  // بخش wishlist — بدون تغییر
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
      <Breadcrumb
        theme="dark"
        items={[{ label: q ? `نتایج جستجو برای «${q}»` : "جستجو" }]}
      />

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">
            نتایج جستجو برای «{q}»
          </h1>
          {count > 0 && (
            <p className="text-sm text-gray-200 mt-1">
              {count.toLocaleString("fa-IR")} محصول پیدا شد
            </p>
          )}
        </div>
        {products.length > 0 && <ProductSortSelect />}
      </div>

      {products.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isWishlisted={wishlistIds.has(product.id)}
              />
            ))}
          </div>

          {count > MIN_PAGE_SIZE && (
            <div className="mt-8 flex items-center justify-between flex-wrap gap-3">
              <PageSizeSelect theme="dark" />
              <Pagination
                basePath="/search"
                currentPage={page}
                totalPages={totalPages}
                extraParams={{ q: q ?? "", sort, pageSize: String(pageSize) }}
              />
            </div>
          )}

          <SimilarSearchSuggestions products={similarProducts} wishlistIds={wishlistIds} />
        </>
      ) : (
        <>
          <p className="text-gray-200">محصولی با نام «{q}» پیدا نشد.</p>
          <SimilarSearchSuggestions products={similarProducts} wishlistIds={wishlistIds} />
        </>
      )}
    </div>
  );
}