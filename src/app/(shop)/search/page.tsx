import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/shop/ProductCard";
import ProductSortSelect from "@/components/shop/ProductSortSelect";
import PageSizeSelect from "@/components/shop/PageSizeSelect";
import Pagination from "@/components/shop/Pagination";
import Breadcrumb from "@/components/shop/Breadcrumb";
import { Product } from "@/types";
import { PRODUCT_LIST_FIELDS } from "@/lib/productFields";

const ALLOWED_PAGE_SIZES = [20, 50, 100];
const MIN_PAGE_SIZE = 20;
const FAR_STRIP_LIMIT = 20;

type SB = Awaited<ReturnType<typeof createClient>>;
type TieredRow = { product_id: string; total_count: number; tier: number };

async function runTiered(
  supabase: SB,
  query: string,
  tier: 0 | 3,
  sort: string,
  limit: number,
  offset: number
): Promise<{ ok: boolean; products: Product[]; total: number }> {
  const { data, error } = await supabase.rpc("search_products_tiered", {
    p_query: query,
    p_tier: tier,
    p_sort: sort,
    p_limit: limit,
    p_offset: offset,
  });
  if (error || !data) return { ok: false, products: [], total: 0 };

  const rows = data as TieredRow[];
  const total = rows.length > 0 ? Number(rows[0].total_count) : 0;
  const ids = rows.map((r) => r.product_id);
  if (ids.length === 0) return { ok: true, products: [], total };

  const { data: pdata } = await supabase.from("products").select(PRODUCT_LIST_FIELDS).in("id", ids);
  const byId = new Map(((pdata ?? []) as unknown as Product[]).map((p) => [p.id, p]));
  const products = ids.map((id) => byId.get(id)).filter((p): p is Product => Boolean(p));
  return { ok: true, products, total };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; page?: string; pageSize?: string; suggest?: string }>;
}) {
  const { q, sort = "newest", page: pageParam, pageSize: pageSizeParam, suggest } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const pageSize = ALLOWED_PAGE_SIZES.includes(Number(pageSizeParam)) ? Number(pageSizeParam) : 20;
  const from = (page - 1) * pageSize;
  const isSuggestMode = suggest === "1";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const normalizedQ = q?.trim().replace(/\s+/g, " ") || "";

  let products: Product[] = [];
  let count = 0;
  let far: Product[] = [];
  let farTotal = 0;
  let similarProducts: Product[] = [];

  if (normalizedQ) {
    if (isSuggestMode) {
      const r = await runTiered(supabase, normalizedQ, 3, sort, pageSize, from);
      products = r.products;
      count = r.total;
    } else {
      const main = await runTiered(supabase, normalizedQ, 0, sort, pageSize, from);
      if (main.ok) {
        products = main.products;
        count = main.total;
      } else {
        // فال‌بک اگر تابع جدید نصب نباشد
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

      const totalPagesForSuggest = Math.max(1, Math.ceil(count / pageSize));
      const onLastPage = count === 0 ? page === 1 : page >= totalPagesForSuggest;
      if (onLastPage) {
        const f = await runTiered(supabase, normalizedQ, 3, sort, FAR_STRIP_LIMIT, 0);
        far = f.products;
        farTotal = f.total;
        if (count === 0 && far.length === 0) {
          const { data: similar } = await supabase.rpc("search_products_similar", {
            p_query: normalizedQ,
            p_exclude_ids: [],
            p_limit: 8,
          });
          similarProducts = (similar as Product[]) ?? [];
        }
      }
    }
  }

  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const showSuggestions =
    !isSuggestMode && normalizedQ !== "" && (count === 0 ? page === 1 : page >= totalPages);
  const suggestionItems = far.length > 0 ? far : similarProducts;

  let wishlistIds = new Set<string>();
  if (user) {
    const { data: wishRows } = await supabase.from("wishlists").select("product_id").eq("user_id", user.id);
    wishlistIds = new Set((wishRows ?? []).map((w) => w.product_id));
  }

  const heading = isSuggestMode ? `موارد پیشنهادی برای «${q}»` : `نتایج جستجو برای «${q}»`;
  const paginationExtra: Record<string, string> = {
    q: q ?? "",
    sort,
    pageSize: String(pageSize),
    ...(isSuggestMode ? { suggest: "1" } : {}),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumb theme="dark" items={[{ label: q ? heading : "جستجو" }]} />

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">{heading}</h1>
          {count > 0 && (
            <p className="text-sm text-gray-200 mt-1">{count.toLocaleString("fa-IR")} محصول پیدا شد</p>
          )}
        </div>
        {products.length > 0 && <ProductSortSelect />}
      </div>

      {isSuggestMode && (
        <Link
          href={`/search?q=${encodeURIComponent(q ?? "")}&pageSize=${pageSize}`}
          className="inline-block mb-6 text-sm text-green-300 hover:underline"
        >
          ← بازگشت به نتایج اصلی
        </Link>
      )}

      {products.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} isWishlisted={wishlistIds.has(product.id)} />
            ))}
          </div>

          {count > MIN_PAGE_SIZE && (
            <div className="mt-8 flex items-center justify-between flex-wrap gap-3">
              <PageSizeSelect theme="dark" />
              <Pagination
                basePath="/search"
                currentPage={page}
                totalPages={totalPages}
                extraParams={paginationExtra}
                theme="dark"
              />
            </div>
          )}
        </>
      ) : (
        <p className="text-gray-200">
          {isSuggestMode ? "موردی برای پیشنهاد پیدا نشد." : `محصولی با نام «${q}» پیدا نشد.`}
        </p>
      )}

      {showSuggestions && suggestionItems.length > 0 && (
        <section className="mt-12">
          <div className="flex items-center gap-3 mb-3">
            <span className="h-px flex-1 bg-white/25" />
            <span className="text-xs text-gray-300">موارد پیشنهادی</span>
            <span className="h-px flex-1 bg-white/25" />
          </div>
          <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm text-gray-200">آیا منظور شما این موارد بود؟</p>
            {far.length > 0 && (
              <Link
                href={`/search?q=${encodeURIComponent(q ?? "")}&suggest=1&sort=${sort}&pageSize=${pageSize}`}
                className="rounded-full bg-green-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-green-700"
              >
                مشاهده همه ({farTotal.toLocaleString("fa-IR")})
              </Link>
            )}
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
            {suggestionItems.map((p) => (
              <div key={p.id} className="w-44 sm:w-52 shrink-0 snap-start">
                <ProductCard product={p} isWishlisted={wishlistIds.has(p.id)} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}