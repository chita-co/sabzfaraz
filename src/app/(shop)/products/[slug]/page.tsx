import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import ProductDetail from "@/components/shop/ProductDetail";
import RelatedProducts from "@/components/shop/RelatedProducts";
import ProductReviewsDisplay from "@/components/shop/ProductReviewsDisplay";
import { Product } from "@/types";
import "./product-detail.css";
import SilkBackground from "@/components/backgrounds/SilkBackground";
import { getLoyaltySettings } from "@/lib/loyalty/settings";
import { getUserTierMultiplier } from "@/lib/loyalty/ledger";
import ProductUnboxingSection from "@/components/shop/ProductUnboxingSection";
import Breadcrumb from "@/components/shop/Breadcrumb";

// این صفحه قبلا force-dynamic بود (رندر کامل روی سرور در هر بازدید، بدون کش).
// چون بیشترین مصرف CPU سایت مربوط به همین صفحه بود، الان با ISR کش میشه:
// صفحه حداکثر تا ۱ ساعت کش میمونه، ولی به محض ویرایش/تغییر قیمت یا موجودی محصول در پنل ادمین
// (از طریق revalidatePath که در اکشن‌های مربوطه صدا زده میشه) بلافاصله کش همون محصول پاک و به‌روز میشه.
export const revalidate = 3600;


const getProductBySlug = cache(async (slug: string) => {
  const admin = createAdminClient();
  const { data } = await admin
    .from("products")
    .select("*, category:categories!products_category_id_fkey(slug, parent_id, name), partner:partners(business_name, rating_avg)")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  return data;
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    const admin = createAdminClient();
    const { data: moved } = await admin
      .from("products")
      .select("id")
      .contains("previous_slugs", [slug])
      .eq("is_active", true)
      .maybeSingle();
    if (moved) return {};
    notFound();
  }
  return {
    title: product.meta_title || `${product.name} | سبزفراز`,
    description: (product.meta_description || product.description)?.slice(0, 160),
    openGraph: { images: product.images?.[0] ? [product.images[0]] : [] },
    ...(product.canonical_url ? { alternates: { canonical: product.canonical_url } } : {}),
  };
}

const getCachedProductExtras = unstable_cache(
  async (productId: string, categoryId: string) => {
    const admin = createAdminClient();
    const [related, reviews, tiers, videos, attrs, blogPosts] = await Promise.all([
      admin.from("products").select("*").eq("category_id", categoryId).eq("is_active", true).neq("id", productId).order("created_at", { ascending: false }).limit(12),
      admin.from("product_reviews").select("*").eq("product_id", productId).order("created_at", { ascending: false }).limit(20),
      admin.from("product_quantity_tiers").select("*").eq("product_id", productId).order("min_qty", { ascending: true }),
      admin.from("unboxing_videos").select("*").eq("product_id", productId).eq("status", "PUBLISHED").order("published_at", { ascending: false }),
      admin.from("product_attributes").select("*").eq("product_id", productId).order("sort_order", { ascending: true }),
      admin.rpc("get_blog_posts_for_product", { p_product_id: productId, p_limit: 6 }),
    ]);
    return {
      relatedProducts: related.data ?? [],
      reviews: reviews.data ?? [],
      quantityTiers: tiers.data ?? [],
      unboxingVideos: videos.data ?? [],
      attributes: attrs.data ?? [],
      relatedArticles: blogPosts.data ?? [],
    };
  },
  ["product-extras"],
  { revalidate: 3600, tags: ["products"] }
);


export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
  const admin = createAdminClient();
  const { data: moved } = await admin
    .from("products")
    .select("slug")
    .contains("previous_slugs", [slug])
    .eq("is_active", true)
    .maybeSingle();
    if (moved?.slug) redirect(`/products/${moved.slug}`);
    notFound();
  }

  // 👇 این خط اضافه می‌شه — چون برای getUser و wishlist لازمه
  const supabase = await createClient();


// ۲. ساخت زنجیره کامل والدین (از دستهٔ فعلی تا ریشه)
  const categoryChain: { name: string; slug: string }[] = [];
  if (product.category?.slug) {
    let currentParentId = product.category.parent_id;
    let safetyCounter = 0;
    while (currentParentId && safetyCounter < 10) {
      safetyCounter++;
      const { data: cat, error: catError } = await supabase
        .from("categories")
        .select("name, slug, parent_id")
        .eq("id", currentParentId)
        .maybeSingle();
      if (catError) {
        console.error("خطا در دریافت زنجیره دسته‌بندی:", JSON.stringify(catError));
        break;
      }
      if (!cat) break;
      categoryChain.unshift({ name: cat.name, slug: cat.slug });
      currentParentId = cat.parent_id;
    }
  }

  const { data: { user } } = await supabase.auth.getUser();

  const [loyaltySettings, loyaltyMultiplier] = await Promise.all([
    getLoyaltySettings(),
    getUserTierMultiplier(user?.id ?? null),
  ]);

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

  const { relatedProducts, reviews, quantityTiers, unboxingVideos, attributes, relatedArticles } = await getCachedProductExtras(product.id, product.category_id);

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

  // ساخت Schema.org برای سئو و ترب — قیمت‌ها به ریال تبدیل می‌شوند
  const tierPrices = (quantityTiers ?? []).map((t) => t.unit_price);
  const basePriceForSchema = product.discount_price ?? product.price;
  const allPrices = tierPrices.length > 0 ? [...tierPrices, basePriceForSchema] : [basePriceForSchema];
  const lowPrice = Math.min(...allPrices) * 10;
  const highPrice = Math.max(...allPrices) * 10;

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images,
    description: product.short_description || product.description,
    sku: product.sku,
    ...(product.gtin && { gtin: product.gtin }),
    ...(product.model_version && { mpn: product.model_version }),
    ...(product.tags && product.tags.length > 0 && { keywords: product.tags.join("، ") }),
    ...(product.brand && { brand: { "@type": "Brand", name: product.brand } }),
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "IRR",
      lowPrice,
      highPrice,
      offerCount: allPrices.length,
      availability: product.stock === 0 ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    },
    ...(product.rating_count > 0 && {
      aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating_avg, reviewCount: product.rating_count },
    }),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <SilkBackground />
      <div className="mx-auto max-w-7xl px-4 pt-8">
        <Breadcrumb
          theme="dark"
          items={[
            // والدین بالادستی (اگر وجود داشته باشند) — از پدربزرگ تا والد مستقیم
            ...categoryChain.map((c) => ({
              label: c.name,
              href: `/category/${c.slug}`,
            })),
            // دستهٔ مستقیم محصول
            { label: product.category?.name ?? "دسته‌بندی", href: `/category/${product.category?.slug}` },
            // نام محصول (صفحه فعلی)
            { label: product.name },
          ]}
        />
      </div>
      <ProductDetail
        product={product}
        isWishlisted={isWishlisted}
        avgRating={product.rating_avg}
        reviewCount={product.rating_count}
        quantityTiers={quantityTiers ?? []}
        attributes={attributes ?? []}
        tomanPerPoint={loyaltySettings.tomanPerPoint}
        pointsMultiplier={loyaltyMultiplier}
        pointValueToman={loyaltySettings.pointValueToman}
        relatedArticles={relatedArticles}
      />

      <div className="mx-auto max-w-7xl px-4">
        <RelatedProducts products={(relatedProducts as Product[]) ?? []} wishlistIds={relatedWishlistIds} categoryHref={`/category/${product.category?.slug}`} />
      </div>

      <div className="mx-auto max-w-7xl px-4">
        <ProductUnboxingSection videos={unboxingVideos ?? []} />
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-12">
        <ProductReviewsDisplay reviews={reviews ?? []} avgRating={product.rating_avg} reviewCount={product.rating_count} />
      </div>
    </>
  );
}