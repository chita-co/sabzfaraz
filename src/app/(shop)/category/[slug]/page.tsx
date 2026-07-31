import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/shop/ProductCard";
import ProductSortSelect from "@/components/shop/ProductSortSelect";
import Pagination from "@/components/shop/Pagination";
import ParticlesBackground from "@/components/backgrounds/ParticlesBackground";
import { Product } from "@/types";
import { LayoutGrid } from "lucide-react";

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

  const { data: subCategories } = await supabase
    .from("categories").select("*").eq("parent_id", category.id).eq("is_active", true).order("name");

  const hasSubCategories = !!subCategories && subCategories.length > 0;

  let products: Product[] = [];
  let count = 0;
  let totalPages = 1;
  let wishlistIds = new Set<string>();

  if (!hasSubCategories) {
    let query = supabase.from("products").select("*", { count: "exact" })
      .eq("category_id", category.id).eq("is_active", true);

    if (sort === "price_asc") query = query.order("effective_price", { ascending: true });
    else if (sort === "price_desc") query = query.order("effective_price", { ascending: false });
    else if (sort === "popular") query = query.order("rating_avg", { ascending: false });
    else query = query.order("created_at", { ascending: false });

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, count: c } = await query.range(from, to);
    products = (data as Product[]) ?? [];
    count = c ?? 0;
    totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

    if (user) {
      const { data: wishRows } = await supabase.from("wishlists").select("product_id").eq("user_id", user.id);
      wishlistIds = new Set((wishRows ?? []).map((w) => w.product_id));
    }
  }

  return (
    <>
      <ParticlesBackground />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-2 text-xl font-bold text-white">{category.name}</h1>
        {category.description && <p className="mb-6 text-sm text-gray-300">{category.description}</p>}

        {hasSubCategories ? (
          <div className="subcategory-grid">
            {subCategories!.map((sc) => (
              <Link key={sc.id} href={`/category/${sc.slug}`} className="subcategory-card">
                <div className="subcategory-card-image">
                  {sc.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={sc.image} alt={sc.name} loading="lazy" />
                  ) : (
                    <div className="subcategory-placeholder-icon"><LayoutGrid size={28} /></div>
                  )}
                </div>
                <span className="subcategory-card-name">{sc.name}</span>
              </Link>
            ))}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-gray-300">{count.toLocaleString("fa-IR")} محصول</p>
              <ProductSortSelect />
            </div>
            {products.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} isWishlisted={wishlistIds.has(product.id)} />
                  ))}
                </div>
                <Pagination basePath={`/category/${slug}`} currentPage={page} totalPages={totalPages} extraParams={{ sort }} />
              </>
            ) : (
              <p className="text-gray-300">محصولی در این دسته‌بندی یافت نشد.</p>
            )}
          </>
        )}
      </div>
    </>
  );
}