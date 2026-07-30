import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/shop/ProductCard";
import HeroCarousel from "@/components/shop/HeroCarousel";
import DealsSection from "@/components/shop/DealsSection";
import { Category, Product, Banner } from "@/types";
import {
  Truck,
  ShieldCheck,
  Headphones,
  BadgeCheck,
  Cable,
  Wrench,
  Cpu,
  Paperclip,
  Monitor,
  Radar,
  Plug,
  LayoutGrid,
} from "lucide-react";
import React from "react";
import GalaxyBackground from "@/components/backgrounds/GalaxyBackground";

const categoryIcons: Record<string, React.ComponentType<{ size?: number }>> = {
  "cables-connectors": Cable,
  "tools-equipment": Wrench,
  modules: Cpu,
  "adhesives-fasteners": Paperclip,
  displays: Monitor,
  sensors: Radar,
  peripherals: Plug,
  devices: Cpu,
  other: LayoutGrid,
};

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: categories },
    { data: products },
    { data: banners },
    { data: settings },
    { data: dealProducts },
    { data: popularProducts },
    { data: wishlistRows },
  ] = await Promise.all([
    supabase
      .from("categories")
      .select("*")
      .is("parent_id", null)
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .eq("show_in_newest", true)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("banners")
      .select("*")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("site_settings")
      .select(
        "deals_enabled, deals_banner_image, deals_banner_link, new_products_banner_image, new_products_banner_link"
      )
      .eq("id", 1)
      .single(),
    supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .eq("is_deal", true)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .eq("is_popular", true)
      .order("created_at", { ascending: false })
      .limit(10),
    user
      ? supabase.from("wishlists").select("product_id").eq("user_id", user.id)
      : Promise.resolve({ data: [] as { product_id: string }[] }),
  ]);

  const wishlistIds = new Set((wishlistRows ?? []).map((w) => w.product_id));

  return (
    <>
      <GalaxyBackground />

      <HeroCarousel banners={(banners as Banner[]) ?? []} />

      {categories && categories.length > 0 && (
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="category-circle-row">
            {(categories as Category[]).map((cat) => {
              const Icon = categoryIcons[cat.slug] ?? LayoutGrid;
              return (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="category-circle-item"
                >
                  <span className="category-circle-icon">
                    {cat.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cat.image} alt={cat.name} loading="eager" />
                    ) : (
                      <Icon size={26} />
                    )}
                  </span>
                  <span className="category-circle-label">{cat.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {settings?.deals_banner_image && (
        <div className="promo-banner-section">
          {settings.deals_banner_link ? (
            <Link
              href={settings.deals_banner_link}
              className="promo-banner-link"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={settings.deals_banner_image}
                alt="جشنواره تخفیف"
                className="promo-banner-img"
                loading="eager"
              />
            </Link>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={settings.deals_banner_image}
              alt="جشنواره تخفیف"
              className="promo-banner-img"
              loading="eager"
            />
          )}
        </div>
      )}

      {settings?.deals_enabled && (
        <DealsSection
          products={(dealProducts as Product[]) ?? []}
          wishlistIds={wishlistIds}
        />
      )}

      {settings?.new_products_banner_image && (
        <div className="promo-banner-section">
          {settings.new_products_banner_link ? (
            <Link
              href={settings.new_products_banner_link}
              className="promo-banner-link"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={settings.new_products_banner_image}
                alt="محصولات جدید"
                className="promo-banner-img"
                loading="eager"
              />
            </Link>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={settings.new_products_banner_image}
              alt="محصولات جدید"
              className="promo-banner-img"
              loading="eager"
            />
          )}
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-6">
        <h2 id="products" className="section-title">
          جدیدترین محصولات
        </h2>
        {products && products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 mb-10">
            {(products as Product[]).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isWishlisted={wishlistIds.has(product.id)}
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 mb-10">هنوز محصولی ثبت نشده است.</p>
        )}

        <h2 className="section-title">محصولات پرطرفدار</h2>
        {popularProducts && popularProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {(popularProducts as Product[]).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isWishlisted={wishlistIds.has(product.id)}
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">
            هنوز محصولی به این بخش اضافه نشده است.
          </p>
        )}
      </div>

      <div className="features-strip">
        <div className="feature-card">
          <div className="feature-icon">
            <Headphones size={20} />
          </div>
          <h3>پشتیبانی فنی</h3>
          <p>مشاوره پیش از خرید</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">
            <BadgeCheck size={20} />
          </div>
          <h3>ضمانت اصالت</h3>
          <p>کالای اورجینال و تست‌شده</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">
            <ShieldCheck size={20} />
          </div>
          <h3>پرداخت امن</h3>
          <p>درگاه معتبر بانکی</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">
            <Truck size={20} />
          </div>
          <h3>ارسال سریع</h3>
          <p>ارسال به سراسر کشور</p>
        </div>
      </div>
    </>
  );
}