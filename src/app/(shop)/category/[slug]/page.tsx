import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Product } from "@/types";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import ProductSortSelect from "@/components/shop/ProductSortSelect";
import ProductListClient from "@/components/shop/ProductListClient";
import ParticlesBackground from "@/components/backgrounds/ParticlesBackground";
import Breadcrumb from "@/components/shop/Breadcrumb";
import DescriptionModal from "@/components/shop/DescriptionModal";
import SubcatCards, { type SubcatItem } from "@/components/shop/SubcatCards";
import { PRODUCT_LIST_FIELDS } from "@/lib/productFields";
import { buildForest, subtreeIds, findBySlug, type CatRow } from "@/lib/categoryTree";
import { productScopeFilter } from "@/lib/categories/productScope";

const ALLOWED_PAGE_SIZES = [20, 50, 100];

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { page } = await searchParams;
  const { data: category } = await createPublicClient()
    .from("categories")
    .select("name, description, meta_title, meta_description")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (!category) return {};
  const base = `/category/${encodeURIComponent(slug)}`;
  const pageNum = Math.max(1, Number(page) || 1);
  return {
    title: category.meta_title || `خرید ${category.name} | سبزفراز`,
    description:
      category.meta_description ||
      category.description?.slice(0, 160) ||
      `خرید آنلاین ${category.name} با بهترین قیمت و ارسال سریع از فروشگاه سبزفراز`,
    alternates: { canonical: pageNum > 1 ? `${base}?page=${pageNum}` : base },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string; page?: string; pageSize?: string; sub?: string }>;
}) {
  const { slug } = await params;
  const { sort = "newest", page: pageParam, pageSize: pageSizeParam, sub } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const pageSize = ALLOWED_PAGE_SIZES.includes(Number(pageSizeParam)) ? Number(pageSizeParam) : 20;

  const supabase = await createClient();
  const [{ data: { user } }, { data: category }, { data: rows }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("categories").select("*").eq("slug", slug).eq("is_active", true).single(),
    supabase.from("categories").select("id, name, slug, parent_id, image").eq("is_active", true),
  ]);
  if (!category) notFound();

  const { byId } = buildForest((rows ?? []) as CatRow[]);
  const root = byId.get(category.id);
  const resolved = root && sub ? findBySlug(root, sub) : undefined;
  const scope = resolved ?? root;
  const isSub = !!resolved;

  const scopeName = scope?.name ?? category.name;
  const scopeIds = scope ? subtreeIds(scope) : [category.id];
  const items: SubcatItem[] = (scope?.children ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    image: c.image ?? null,
    children: c.children.map((g) => ({ name: g.name, slug: g.slug })),
  }));

  let parentCategory: { name: string; slug: string } | null = null;
  if (category.parent_id) {
    const { data: parent } = await supabase
      .from("categories")
      .select("name, slug")
      .eq("id", category.parent_id)
      .single();
    parentCategory = parent;
  }

  let query = supabase
    .from("products")
    .select(PRODUCT_LIST_FIELDS, { count: "exact" })
    .or(await productScopeFilter(scopeIds))
    .eq("is_active", true);
  if (sort === "price_asc") query = query.order("effective_price", { ascending: true });
  else if (sort === "price_desc") query = query.order("effective_price", { ascending: false });
  else if (sort === "popular") query = query.order("rating_avg", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, count: c } = await query.range(from, to);
  const products = (data ?? []) as unknown as Product[];
  const count = c ?? 0;

  let wishlistIds: string[] = [];
  if (user && products.length > 0) {
    const { data: wishRows } = await supabase
      .from("wishlists")
      .select("product_id")
      .eq("user_id", user.id)
      .in("product_id", products.map((p) => p.id));
    wishlistIds = (wishRows ?? []).map((w) => w.product_id);
  }

  const basePath = `/category/${slug}`;

  return (
    <>
      <ParticlesBackground />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Breadcrumb
          theme="dark"
          items={[
            ...(parentCategory ? [{ label: parentCategory.name, href: `/category/${parentCategory.slug}` }] : []),
            ...(isSub
              ? [{ label: category.name, href: basePath }, { label: scopeName }]
              : [{ label: category.name }]),
          ]}
        />

        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-xl font-bold text-white">{scopeName}</h1>
          {!isSub && category.description && (
            <DescriptionModal title={category.name} description={category.description} />
          )}
          {isSub && (
            <Link href={basePath} className="text-sm font-bold text-amber-300">
              مشاهده همه
            </Link>
          )}
        </div>

        {items.length > 0 && <SubcatCards items={items} basePath={basePath} />}

        <div className="flex items-center justify-between mb-5 mt-4">
          <p className="text-sm text-gray-300">{count.toLocaleString("fa-IR")} محصول</p>
          <ProductSortSelect />
        </div>
        <ProductListClient
          mode="category"
          categoryId={scopeIds.join(",")}
          sort={sort}
          initialProducts={products}
          initialCount={count}
          initialPage={page}
          initialPageSize={pageSize}
          initialWishlistIds={wishlistIds}
          basePath={basePath}
        />
      </div>
    </>
  );
}