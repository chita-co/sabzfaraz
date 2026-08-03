import Link from "next/link";
import { Product } from "@/types";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProductSortSelect from "@/components/shop/ProductSortSelect";
import ProductListClient from "@/components/shop/ProductListClient";
import ParticlesBackground from "@/components/backgrounds/ParticlesBackground";
import { LayoutGrid } from "lucide-react";

const ALLOWED_PAGE_SIZES = [20, 50, 100];

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string; page?: string; pageSize?: string }>;
}) {
  const { slug } = await params;
  const { sort = "newest", page: pageParam, pageSize: pageSizeParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const pageSize = ALLOWED_PAGE_SIZES.includes(Number(pageSizeParam)) ? Number(pageSizeParam) : 20;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: category } = await supabase.from("categories").select("*").eq("slug", slug).eq("is_active", true).single();
  if (!category) notFound();

  const { data: subCategories } = await supabase.from("categories").select("*").eq("parent_id", category.id).eq("is_active", true).order("name");
  const hasSubCategories = !!subCategories && subCategories.length > 0;

  let products: Product[] = [];
  let count = 0;
  let wishlistIds: string[] = [];

  if (!hasSubCategories) {
    let query = supabase.from("products").select("*", { count: "exact" }).eq("category_id", category.id).eq("is_active", true);
    if (sort === "price_asc") query = query.order("effective_price", { ascending: true });
    else if (sort === "price_desc") query = query.order("effective_price", { ascending: false });
    else if (sort === "popular") query = query.order("rating_avg", { ascending: false });
    else query = query.order("created_at", { ascending: false });

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, count: c } = await query.range(from, to);
    products = data ?? [];
    count = c ?? 0;

    if (user && products.length > 0) {
      const { data: wishRows } = await supabase.from("wishlists").select("product_id").eq("user_id", user.id).in("product_id", products.map((p) => p.id));
      wishlistIds = (wishRows ?? []).map((w) => w.product_id);
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
            <ProductListClient mode="category" categoryId={category.id} sort={sort} initialProducts={products} initialCount={count} initialPage={page} initialPageSize={pageSize} initialWishlistIds={wishlistIds} basePath={`/category/${slug}`} />
          </>
        )}
      </div>
    </>
  );
}