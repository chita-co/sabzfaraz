import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProductDetail from "@/components/shop/ProductDetail";
import RelatedProducts from "@/components/shop/RelatedProducts";
import ProductReviewsDisplay from "@/components/shop/ProductReviewsDisplay";
import { Product } from "@/types";
import "./product-detail.css";
import SilkBackground from "@/components/backgrounds/SilkBackground";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("*, category:categories(slug)")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!product) notFound();

  const { data: { user } } = await supabase.auth.getUser();

  let isWishlisted = false;
  if (user) {
    const { data: wish } = await supabase
      .from("wishlists")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", product.id)
      .maybeSingle();
    isWishlisted = !!wish;
  }

  const [{ data: relatedProducts }, { data: reviews }] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .eq("category_id", product.category_id)
      .eq("is_active", true)
      .neq("id", product.id)
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("product_reviews")
      .select("*")
      .eq("product_id", product.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const relatedIds = (relatedProducts ?? []).map((p) => p.id);
  let relatedWishlistIds = new Set<string>();
  if (user && relatedIds.length > 0) {
    const { data: wishRows } = await supabase
      .from("wishlists")
      .select("product_id")
      .eq("user_id", user.id)
      .in("product_id", relatedIds);
    relatedWishlistIds = new Set((wishRows ?? []).map((w) => w.product_id));
  }

  return (
    <>
    <SilkBackground />
      <ProductDetail
        product={product}
        isWishlisted={isWishlisted}
        avgRating={product.rating_avg}
        reviewCount={product.rating_count}
      />

      <div className="mx-auto max-w-7xl px-4">
        <RelatedProducts
          products={(relatedProducts as Product[]) ?? []}
          wishlistIds={relatedWishlistIds}
          categoryHref={`/category/${product.category?.slug}`}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-12">
        <ProductReviewsDisplay reviews={reviews ?? []} avgRating={product.rating_avg} reviewCount={product.rating_count} />
      </div>
    </>
  );
}