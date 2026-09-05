import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import HeroCarousel from "@/components/shop/HeroCarousel";
import DealsSection from "@/components/shop/DealsSection";
import HorizontalProductSection from "@/components/shop/HorizontalProductSection";
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
import TopFilterBar from "@/components/shop/TopFilterBar";
import HomePriceWidget from "@/components/price-ticker/HomePriceWidget";

export const metadata = {
  title: "سبزفراز | فروشگاه اینترنتی قطعات الکترونیک",
  description:
    "فروشگاه سبزفراز؛ تأمین‌کننده تخصصی قطعات الکترونیک، ماژول، سنسور، برد آردوینو، ESP، لوازم لحیم‌کاری و ابزارآلات. ارسال از اصفهان به سراسر کشور با قیمت مناسب و موجودی واقعی.",
};

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
    { data: stockProducts },
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
      .or("partner_id.is.null,partner_approval_status.eq.APPROVED")
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("banners")
      .select("*")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("site_settings")
      .select(
        "deals_enabled, deals_banner_image, deals_banner_link, new_products_banner_image, new_products_banner_link, stock_enabled"
      )
      .eq("id", 1)
      .single(),
    supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .eq("is_deal", true)
      .or("partner_id.is.null,partner_approval_status.eq.APPROVED")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .eq("is_popular", true)
      .or("partner_id.is.null,partner_approval_status.eq.APPROVED")
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .eq("is_stock", true)
      .or("partner_id.is.null,partner_approval_status.eq.APPROVED")
      .order("created_at", { ascending: false })
      .limit(12),
    user
      ? supabase.from("wishlists").select("product_id").eq("user_id", user.id)
      : Promise.resolve({ data: [] as { product_id: string }[] }),
  ]);

  const wishlistIds = new Set((wishlistRows ?? []).map((w) => w.product_id));

  return (
    <>
      <GalaxyBackground />
      <TopFilterBar />
      <HeroCarousel banners={(banners as Banner[]) ?? []} />
      <HomePriceWidget />

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
        <HorizontalProductSection
          title="جدیدترین محصولات"
          seeAllHref="/newest"
          products={(products as Product[]) ?? []}
          wishlistIds={wishlistIds}
        />

        <HorizontalProductSection
          title="محصولات پرطرفدار"
          seeAllHref="/popular"
          products={(popularProducts as Product[]) ?? []}
          wishlistIds={wishlistIds}
        />

        {settings?.stock_enabled && (
          <HorizontalProductSection
            title="محصولات استوک"
            seeAllHref="/stock"
            products={(stockProducts as Product[]) ?? []}
            wishlistIds={wishlistIds}
          />
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