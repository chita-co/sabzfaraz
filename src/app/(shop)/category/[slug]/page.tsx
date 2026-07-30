import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/shop/ProductCard";
import ProductSortSelect from "@/components/shop/ProductSortSelect";
import Pagination from "@/components/shop/Pagination";
import { Product } from "@/types";

const PAGE_SIZE = 20;

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string; page?: string }>;
}) {
  const { slug } = await params;
  const { sort = "newest", page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: category } = await supabase
    .from("categories").select("*").eq("slug", slug).eq("is_active", true).single();
  if (!category) notFound();

  const [{ data: subCategories }] = await Promise.all([
    supabase.from("categories").select("*").eq("parent_id", category.id).eq("is_active", true).order("name"),
  ]);

  let query = supabase
    .from("products")
    .select("*", { count: "exact" })
    .eq("category_id", category.id)
    .eq("is_active", true);

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
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-2 text-xl font-bold text-gray-900">{category.name}</h1>
      {category.description && <p className="mb-6 text-sm text-gray-500">{category.description}</p>}

      {subCategories && subCategories.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {subCategories.map((sc) => (
            <Link key={sc.id} href={`/category/${sc.slug}`} className="rounded-full border border-gray-300 px-4 py-1.5 text-sm text-gray-700 hover:border-green-500 hover:text-green-700">
              {sc.name}
            </Link>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-500">{(count ?? 0).toLocaleString("fa-IR")} محصول</p>
        <ProductSortSelect />
      </div>

      {products && products.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {(products as Product[]).map((product) => (
              <ProductCard key={product.id} product={product} isWishlisted={wishlistIds.has(product.id)} />
            ))}
          </div>
          <Pagination
            basePath={`/category/${slug}`}
            currentPage={page}
            totalPages={totalPages}
            extraParams={{ sort }}
          />
        </>
      ) : (
        <p className="text-gray-500">محصولی در این دسته‌بندی یافت نشد.</p>
      )}
    </div>
  );
}