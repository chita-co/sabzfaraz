"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import toast from "react-hot-toast";
import {
  Search, ShoppingCart, Heart, User, UserPlus, X,
  LayoutDashboard, LogOut, Package, Gift, Clapperboard, Wallet,
  Handshake, PackageSearch, Scale, Home, LayoutGrid, Percent, Trash2, Minus, Plus, ShoppingBag,
} from "lucide-react";
import { signOut } from "@/app/(auth)/actions";
import { useCartStore, useCartTotals } from "@/store/cart-store";
import GooeyNav, { type GooeyNavItem } from "@/components/GooeyNav";
import NotificationBell from "@/components/shop/NotificationBell";
import LivePriceBadge from "@/components/shop/LivePriceBadge";
import ShinyText from "@/components/ShinyText";
import type { HeaderPriceSummary } from "@/lib/priceTicker/headerSummary";
import { useShallow } from "zustand/react/shallow";

const subscribeToCartHydration = (callback: () => void) =>
  useCartStore.persist.onFinishHydration(callback);

const getCartHydratedSnapshot = () =>
  useCartStore.persist.hasHydrated();

const getCartHydratedServerSnapshot = () => false;

interface CategoryLite { id: string; name: string; slug: string; }
interface CategoryTreeItem extends CategoryLite { children: CategoryLite[]; }

export default function HeaderNav({
  isLoggedIn, userName, isAdmin, categories, categoryTree, logoUrl, walletBalance = 0, auctionEnabled = true, auctionLabel = "جمعه بازار", prices,
}: {
  isLoggedIn: boolean;
  userName: string | null;
  isAdmin: boolean;
  categories: CategoryLite[];
  categoryTree?: CategoryTreeItem[];
  logoUrl?: string | null;
  walletBalance?: number;
  auctionEnabled?: boolean;
  auctionLabel?: string;
  prices?: HeaderPriceSummary;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { totalItems } = useCartTotals();
  const { cartItems, removeItem, updateQuantity } = useCartStore(
  useShallow((s) => ({
    cartItems: s.items,
    removeItem: s.removeItem,
    updateQuantity: s.updateQuantity,
  }))
);

  const navItems: GooeyNavItem[] = [
    { type: "link", label: "خانه", href: "/", shiny: true },
    {
      type: "dropdown",
      label: "دسته‌بندی‌ها",
      children: (categoryTree ?? categories.map((c) => ({ ...c, children: [] }))).map((c) => ({
        label: c.name,
        href: `/category/${c.slug}`,
        children: c.children.map((sub) => ({ label: sub.name, href: `/category/${sub.slug}` })),
      })),
    },
    ...(auctionEnabled ? [{ type: "link" as const, label: auctionLabel, href: "/auctions" }] : []),
    { type: "link", label: "آنباکس", href: "/unboxing" },
    { type: "link", label: "سفارش جمعی", href: "/bulk-order" },
    { type: "link", label: "بلاگ", href: "/blog" },
     { type: "link", label: "قیمت لحظه‌ای", href: "/price-ticker" },
     { type: "link", label: "تقویم و رویدادها", href: "/calendar" },
    { type: "link", label: "درباره ما", href: "/about" },
    { type: "link", label: "تماس با ما", href: "/contact" },
  ];

  let initialNavIndex = navItems.findIndex((i) => i.type !== "dropdown" && i.href === pathname);
  if (initialNavIndex === -1 && pathname.startsWith("/category")) initialNavIndex = 1;
  if (initialNavIndex === -1) initialNavIndex = 0;

  const [accountOpen, setAccountOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);

  // درایورهای موبایل (سایدبار دسته‌بندی، سبد خرید، پروفایل)
  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});
  const cartHydrated = useSyncExternalStore(
  subscribeToCartHydration,
  getCartHydratedSnapshot,
  getCartHydratedServerSnapshot
);

  function toggleCat(id: string) {
    setExpandedCats((s) => ({ ...s, [id]: !s[id] }));
  }

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (categoryDrawerOpen || cartDrawerOpen || profileDrawerOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [categoryDrawerOpen, cartDrawerOpen, profileDrawerOpen]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/search?q=${encodeURIComponent(search.trim())}`);
    }
  }

  function handleMobileCheckout() {
    setCartDrawerOpen(false);
    router.push(isLoggedIn ? "/checkout" : "/login?redirect=/checkout");
  }

  const cartTotalPrice = cartItems.reduce((sum, i) => sum + (i.discountPrice ?? i.price) * i.quantity, 0);

  /* ===== سایدبار دسته‌بندی (راست) ===== */
  const categoryDrawer = (
    <div className="mobile-drawer-overlay from-right" onClick={() => setCategoryDrawerOpen(false)}>
      <div className="mobile-drawer-panel mobile-category-panel" onClick={(e) => e.stopPropagation()}>
        <div className="mobile-drawer-header">
          <span>دسته‌بندی‌ها</span>
          <button type="button" className="mobile-drawer-close" onClick={() => setCategoryDrawerOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <div className="mobile-drawer-body mobile-category-body">
          {(categoryTree ?? categories.map((c) => ({ ...c, children: [] }))).map((cat) => (
            <div key={cat.id} className="mobile-cat-group">
              <div className="mobile-cat-row">
                <Link
                  href={`/category/${cat.slug}`}
                  className="mobile-cat-link"
                  onClick={() => setCategoryDrawerOpen(false)}
                >
                  {cat.name}
                </Link>
                {cat.children.length > 0 && (
                  <button
                    type="button"
                    className={`mobile-cat-expand${expandedCats[cat.id] ? " expanded" : ""}`}
                    onClick={() => toggleCat(cat.id)}
                    aria-label="نمایش زیردسته‌ها"
                  >
                    <Plus size={13} />
                  </button>
                )}
              </div>
              {cat.children.length > 0 && expandedCats[cat.id] && (
                <div className="mobile-subcat-list">
                  {cat.children.map((sub) => (
                    <Link
                      key={sub.id}
                      href={`/category/${sub.slug}`}
                      className="mobile-subcat-link"
                      onClick={() => setCategoryDrawerOpen(false)}
                    >
                      {sub.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div className="mobile-drawer-divider" />

          {auctionEnabled && (
            <Link href="/auctions" className="mobile-drawer-extra-link" onClick={() => setCategoryDrawerOpen(false)}>
              {auctionLabel}
            </Link>
          )}
          <Link href="/unboxing" className="mobile-drawer-extra-link" onClick={() => setCategoryDrawerOpen(false)}>
            <Clapperboard size={14} /> آنباکس
          </Link>
          <Link href="/bulk-order" className="mobile-drawer-extra-link" onClick={() => setCategoryDrawerOpen(false)}>
            سفارش جمعی
          </Link>
          <Link href="/blog" className="mobile-drawer-extra-link" onClick={() => setCategoryDrawerOpen(false)}>
            بلاگ
          </Link>
          <Link href="/price-ticker" className="mobile-drawer-extra-link" onClick={() => setCategoryDrawerOpen(false)}>
            قیمت لحظه‌ای
          </Link>
          <Link href="/calendar" className="mobile-drawer-extra-link" onClick={() => setCategoryDrawerOpen(false)}>
            تقویم و رویدادها
          </Link>
          <Link href="/about" className="mobile-drawer-extra-link" onClick={() => setCategoryDrawerOpen(false)}>
            درباره ما
          </Link>
          <Link href="/contact" className="mobile-drawer-extra-link" onClick={() => setCategoryDrawerOpen(false)}>
            تماس با ما
          </Link>
        </div>
      </div>
    </div>
  );

  /* ===== سایدبار سبد خرید (چپ) ===== */
  const cartDrawer = (
    <div className="mobile-drawer-overlay from-left" onClick={() => setCartDrawerOpen(false)}>
      <div className="mobile-drawer-panel mobile-cart-panel" onClick={(e) => e.stopPropagation()}>
        <div className="mobile-drawer-header">
          <span>سبد خرید</span>
          <button type="button" className="mobile-drawer-close" onClick={() => setCartDrawerOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {!cartHydrated ? (
  <div className="mobile-cart-empty">
    <ShoppingBag size={40} />
    <p>در حال بارگذاری سبد...</p>
  </div>
) : cartItems.length === 0 ? (
  <div className="mobile-cart-empty">
    <ShoppingBag size={40} />
    <p>سبد خرید شما خالی است</p>
    <Link href="/" onClick={() => setCartDrawerOpen(false)}>بازگشت به فروشگاه</Link>
  </div>
) : (
          <>
            <div className="mobile-drawer-body mobile-cart-body">
              {cartItems.map((item) => (
                <div
                  key={`${item.productId}-${item.selectedColor}-${item.selectedSize}`}
                  className="mobile-cart-item"
                >
                  <Link
                    href={`/products/${item.slug}`}
                    className="mobile-cart-item-img"
                    onClick={() => setCartDrawerOpen(false)}
                  >
                    <Image src={item.image} alt={item.name} fill sizes="56px" style={{ objectFit: "cover" }} />
                  </Link>
                  <div className="mobile-cart-item-info">
                    <Link
                      href={`/products/${item.slug}`}
                      className="mobile-cart-item-name"
                      onClick={() => setCartDrawerOpen(false)}
                    >
                      {item.name}
                    </Link>
                    <div className="mobile-cart-item-row">
                      <div className="mobile-cart-qty">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.selectedColor, item.selectedSize, item.quantity - 1)}
                          disabled={item.quantity <= (item.minQuantity ?? 1)}
                        >
                          <Minus size={12} />
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.selectedColor, item.selectedSize, item.quantity + 1)}
                          disabled={item.stock !== null && item.quantity >= item.stock}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <span className="mobile-cart-item-price">
                        {((item.discountPrice ?? item.price) * item.quantity).toLocaleString("fa-IR")} تومان
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="mobile-cart-item-remove"
                    onClick={() => removeItem(item.productId, item.selectedColor, item.selectedSize)}
                    aria-label="حذف از سبد خرید"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="mobile-cart-footer">
              <div className="mobile-cart-total">
                <span>مبلغ قابل پرداخت</span>
                <b>{cartTotalPrice.toLocaleString("fa-IR")} تومان</b>
              </div>
              <button type="button" className="mobile-cart-checkout-btn" onClick={handleMobileCheckout}>
                تکمیل خرید
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  /* ===== سایدبار پروفایل (چپ) ===== */
  const profileDrawer = (
    <div className="mobile-drawer-overlay from-left" onClick={() => setProfileDrawerOpen(false)}>
      <div className="mobile-drawer-panel mobile-profile-panel" onClick={(e) => e.stopPropagation()}>
        <div className="mobile-drawer-header">
          <span>{userName || "حساب من"}</span>
          <button type="button" className="mobile-drawer-close" onClick={() => setProfileDrawerOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <div className="mobile-drawer-body">
          <Link href="/profile" className="mobile-drawer-extra-link" onClick={() => setProfileDrawerOpen(false)}>
            پروفایل من
          </Link>
          <Link href="/profile/orders" className="mobile-drawer-extra-link" onClick={() => setProfileDrawerOpen(false)}>
            <Package size={15} /> سفارشات من
          </Link>
          <Link href="/profile/loyalty" className="mobile-drawer-extra-link" onClick={() => setProfileDrawerOpen(false)}>
            <Gift size={15} /> باشگاه مشتریان
          </Link>
          <Link href="/unboxing" className="mobile-drawer-extra-link" onClick={() => setProfileDrawerOpen(false)}>
            <Clapperboard size={15} /> آنباکس محصولات
          </Link>
          <Link href="/profile/wallet" className="mobile-drawer-extra-link" onClick={() => setProfileDrawerOpen(false)}>
            <Wallet size={15} /> کیف پول ({walletBalance.toLocaleString("fa-IR")} تومان)
          </Link>
          {isAdmin && (
            <Link href="/admin" className="mobile-drawer-extra-link mobile-drawer-admin-link" onClick={() => setProfileDrawerOpen(false)}>
              <LayoutDashboard size={15} /> پنل مدیریت
            </Link>
          )}

          <div className="mobile-drawer-divider" />

          <Link href="/partner/login" className="mobile-drawer-extra-link" onClick={() => setProfileDrawerOpen(false)}>
            <Handshake size={15} /> ورود همکاران
          </Link>
          <button
            type="button"
            className="mobile-drawer-extra-link"
            onClick={() => {
              setProfileDrawerOpen(false);
              toast("این قابلیت به‌زودی اضافه می‌شود.");
            }}
          >
            <Scale size={15} /> لیست مقایسه
          </button>

          <form action={signOut} className="mobile-drawer-logout-form">
            <button type="submit" className="mobile-drawer-logout-btn">
              <LogOut size={15} /> خروج
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <header className="site-header">
        {/* ردیف اول: همان محتوای TopBar سابق (فقط دسکتاپ) */}
        <div className="site-header-topbar">
          <div className="topbar-actions">
            {isLoggedIn ? (
              <div
                className="site-nav-dropdown"
                onMouseEnter={() => setAccountOpen(true)}
                onMouseLeave={() => setAccountOpen(false)}
              >
                <button type="button" className="topbar-btn">
                  <User size={14} /> {userName || "حساب من"}
                </button>
                {accountOpen && (
                  <div className="site-dropdown-menu site-dropdown-left">
                    <div className="site-dropdown-user">{userName || "کاربر"}</div>
                    <Link href="/profile">پروفایل من</Link>
                    <Link href="/profile/orders"><Package size={14} /> سفارشات من</Link>
                    <Link href="/profile/loyalty"><Gift size={14} /> باشگاه مشتریان</Link>
                    <Link href="/unboxing"><Clapperboard size={14} /> آنباکس محصولات</Link>
                    <Link href="/profile/wallet"><Wallet size={14} /> کیف پول ({walletBalance.toLocaleString("fa-IR")} تومان)</Link>
                    {isAdmin && (
                      <Link href="/admin" className="site-dropdown-admin"><LayoutDashboard size={14} /> پنل مدیریت</Link>
                    )}
                    <form action={signOut}>
                      <button type="submit" className="site-dropdown-logout"><LogOut size={14} /> خروج</button>
                    </form>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="topbar-btn">
                <UserPlus size={14} /> ورود / ثبت‌نام
              </Link>
            )}
            <Link href="/partner/login" className="topbar-btn">
              <Handshake size={14} /> ورود همکاران
            </Link>
            <Link href="/profile/orders" className="topbar-btn">
              <PackageSearch size={14} /> پیگیری سفارشتان
            </Link>
            <button
              type="button"
              className="topbar-btn"
              onClick={() => toast("این قابلیت به‌زودی اضافه می‌شود.")}
            >
              <Scale size={14} /> لیست مقایسه
            </button>
          </div>

          {prices && (prices.usd || prices.gold18k || prices.bitcoin) && (
            <Link href="/price-ticker" className="topbar-deals">
              {prices.usd && <LivePriceBadge label="دلار" price={prices.usd.price} changePercent={prices.usd.changePercent} colorVar="1" />}
              {prices.gold18k && <LivePriceBadge label="طلای ۱۸ عیار" price={prices.gold18k.price} changePercent={prices.gold18k.changePercent} colorVar="2" />}
              {prices.bitcoin && <LivePriceBadge label="بیت‌کوین" price={prices.bitcoin.price} changePercent={prices.bitcoin.changePercent} unit="تومان" colorVar="3" />}
            </Link>
          )}
        </div>

        {/* ردیف دوم: لوگو + سرچ + آیکون‌ها */}
        <div className="site-header-inner">
          <Link href="/" className="site-brand-logo" aria-label="سبزفراز - صفحه اصلی">
            {logoUrl && (
              <span className="site-logo-shine-wrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoUrl} alt="سبزفراز" className="site-logo-img" />
              </span>
            )}
          </Link>

          <ShinyText
            text="فروشگاه اینترنتی سبزفراز"
            color="#4ade80"
            shineColor="#fde047"
            speed={4}
            spread={40}
            className="site-header-title"
          />

          <div className="site-actions">
            <form className="site-search" onSubmit={handleSearch}>
              <Search size={16} />
              <input
                type="text"
                id="mobile-search-input"
                name="search"
                placeholder="جستجوی محصول..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>
            <Link href="/wishlist" className="site-icon-btn"><Heart size={20} /></Link>
            <NotificationBell />
            <Link href="/cart" className="site-icon-btn cart-icon-wrap desktop-only-cart">
              <ShoppingCart size={20} />
              {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
            </Link>
          </div>
        </div>

        <div className="site-mobile-search-row">
          <form className="site-mobile-search-row-form" onSubmit={handleSearch}>
            <Search size={16} />
            <input
              type="text"
              id="header-mobile-inline-search-input"
              name="search"
              placeholder="جستجوی محصول..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
        </div>

        {/* ردیف سوم: منوی اصلی (فقط دسکتاپ) */}
        <div className="site-header-nav-row">
          <nav className="site-nav">
            <div className="gooey-nav-wrapper">
              <GooeyNav items={navItems} initialActiveIndex={initialNavIndex} />
            </div>
          </nav>
        </div>

        <style jsx>{`
          .site-header {
            margin-top: 1cm;
          }

          .site-brand-logo { display: inline-flex; align-items: center; flex-shrink: 0; }
          .site-actions, .site-actions > * { flex-shrink: 0; }

          :global(.site-header-title) {
            font-size: 26px;
            font-weight: 900;
            letter-spacing: 0.3px;
            white-space: nowrap;
            flex-shrink: 0;
            font-family: "Vazirmatn", "Tahoma", sans-serif;
          }
          @media (max-width: 900px) and (min-width: 641px) {
            :global(.site-header-title) {
              font-size: 20px;
            }
          }
          @media (max-width: 640px) {
            :global(.site-header-title) {
              font-size: 14px;
            }
          }

          @media (max-width: 640px) {
            .site-mobile-search-row {
              display: flex;
              max-width: 1280px;
              margin: 0 auto;
              padding: 8px 16px 2px;
            }
            .site-mobile-search-row-form {
              display: flex;
              align-items: center;
              gap: 8px;
              width: 100%;
              background: rgba(255, 255, 255, 0.95);
              border: 1px solid #d1d5db;
              border-radius: 999px;
              padding: 9px 16px;
            }
            .site-mobile-search-row-form :global(svg) { color: #6b7280; flex-shrink: 0; }
            .site-mobile-search-row-form input {
              border: none; outline: none; background: transparent;
              font-size: 13px; color: #111827; width: 100%; font-family: inherit;
            }
            .site-mobile-search-row-form input::placeholder { color: #9ca3af; }
          }
          @media (min-width: 641px) {
            .site-mobile-search-row { display: none; }
          }
          .site-header-topbar {
            max-width: 1280px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            padding: 8px 20px;
            flex-wrap: wrap;
            border-bottom: 1px solid rgba(255, 215, 0, 0.2);
          }
          .topbar-actions {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
            margin-right: 18px;
          }
          .topbar-btn {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 5px !important;
            font-size: 11.5px !important;
            font-weight: 700 !important;
            line-height: 1.4 !important;
            padding: 7px 14px !important;
            min-width: 132px !important;
            max-width: 132px !important;
            height: 30px !important;
            box-sizing: border-box !important;
            border-radius: 999px !important;
            border: none !important;
            cursor: pointer !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            background: linear-gradient(135deg, #ffd700, #eab308) !important;
            color: #14532d !important;
            box-shadow: 0 2px 8px rgba(234, 179, 8, 0.35) !important;
            transition: transform 0.15s ease, box-shadow 0.15s ease !important;
            font-family: inherit !important;
            text-decoration: none !important;
            margin: 0 !important;
          }
          .topbar-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(234, 179, 8, 0.5);
          }
          :global(.topbar-deals) {
            display: flex;
            align-items: center;
            gap: 10px;
            text-decoration: none;
            margin-inline-start: 28px;
          }
          :global(.price-badge) {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 5px 12px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 600;
            color: #fff;
            white-space: nowrap;
            transition: transform 0.15s ease, box-shadow 0.15s ease;
          }
          :global(.price-badge:hover) {
            transform: translateY(-1px);
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
          }
          :global(.price-badge-c1) { background: rgba(22, 163, 74, 0.35); border: 1px solid #16a34a; }
          :global(.price-badge-c2) { background: rgba(234, 179, 8, 0.3); border: 1px solid #eab308; }
          :global(.price-badge-c3) { background: rgba(74, 222, 128, 0.25); border: 1px solid #4ade80; }
          :global(.price-badge-label) { opacity: 0.9; }
          :global(.price-badge-value b) { font-weight: 500; font-size: 10px; opacity: 0.85; }
          :global(.price-badge-change) {
            display: inline-flex;
            align-items: center;
            gap: 2px;
            font-size: 10px;
            font-weight: 700;
            border-radius: 6px;
            padding: 1px 5px;
          }
          :global(.price-badge-change.up) { background: rgba(74, 222, 128, 0.25); color: #4ade80; }
          :global(.price-badge-change.down) { background: rgba(248, 113, 113, 0.25); color: #f87171; }

          .site-header-nav-row {
            max-width: 1280px;
            margin: 0 auto;
            padding: 0 20px 14px;
            display: flex;
            align-items: center;
          }

          @media (min-width: 641px) {
            .site-header-nav-row {
              overflow-x: auto;
              overflow-y: hidden;
              scrollbar-width: none;
              -ms-overflow-style: none;
            }
            .site-header-nav-row::-webkit-scrollbar { display: none; }
            .gooey-nav-wrapper { flex-shrink: 0; }
          }

          @media (max-width: 1024px) and (min-width: 641px) {
            .site-header-inner { gap: 14px !important; }
          }

          @media (max-width: 640px) {
  .site-header-topbar {
    display: flex !important;
    padding: 4px 12px !important;
    justify-content: center !important;
  }
  .topbar-actions { display: none !important; }
  :global(.topbar-deals) {
    margin-inline-start: 0 !important;
    gap: 4px !important;
    transform: scale(0.72);
    transform-origin: center;
  }
}

          @media (max-width: 400px) {
            .site-header-inner { padding: 0 12px !important; gap: 10px !important; }
            .site-actions { gap: 4px !important; }
            .site-icon-btn { width: 36px !important; height: 36px !important; }
            .site-logo-img { height: 52px !important; }
          }
        `}</style>
      </header>

      {/* ===== نوار پایین موبایل (۵ دکمه) ===== */}
      <nav className="mobile-bottom-nav" aria-label="ناوبری پایین صفحه">
        <Link href="/" className="mobile-bottom-nav-item">
          <Home size={20} />
          <span>خانه</span>
        </Link>

        <button type="button" className="mobile-bottom-nav-item" onClick={() => setCategoryDrawerOpen(true)}>
          <LayoutGrid size={20} />
          <span>دسته‌بندی</span>
        </button>

        <Link href="/#deals-section" className="mobile-bottom-nav-item deals-center-item">
          <span className="deals-center-circle">
            <Percent size={20} />
          </span>
          <span>فروش ویژه</span>
        </Link>

        <button type="button" className="mobile-bottom-nav-item" onClick={() => setCartDrawerOpen(true)}>
          <span className="cart-icon-wrap">
            <ShoppingCart size={20} />
            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </span>
          <span>سبد خرید</span>
        </button>

        {isLoggedIn ? (
          <button type="button" className="mobile-bottom-nav-item" onClick={() => setProfileDrawerOpen(true)}>
            <User size={20} />
            <span>پروفایل</span>
          </button>
        ) : (
          <Link href="/login" className="mobile-bottom-nav-item">
            <UserPlus size={20} />
            <span>ورود</span>
          </Link>
        )}
      </nav>

      {mounted && categoryDrawerOpen && createPortal(categoryDrawer, document.body)}
      {mounted && cartDrawerOpen && createPortal(cartDrawer, document.body)}
      {mounted && profileDrawerOpen && createPortal(profileDrawer, document.body)}
    </>
  );
}
