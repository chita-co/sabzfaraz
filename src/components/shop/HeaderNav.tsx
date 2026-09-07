"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import toast from "react-hot-toast";
import {
  Search, ShoppingCart, Heart, User, UserPlus, Menu, X,
  LayoutDashboard, LogOut, Package, Gift, Clapperboard, Wallet,
  Handshake, PackageSearch, Scale,
} from "lucide-react";
import { signOut } from "@/app/(auth)/actions";
import { useCartTotals } from "@/store/cart-store";
import GooeyNav, { type GooeyNavItem } from "@/components/GooeyNav";
import NotificationBell from "@/components/shop/NotificationBell";
import LivePriceBadge from "@/components/shop/LivePriceBadge";
import type { HeaderPriceSummary } from "@/lib/priceTicker/headerSummary";

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

  const navItems: GooeyNavItem[] = [
    { type: "link", label: "سبزفراز", href: "/", shiny: true },
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
    { type: "link", label: "درباره ما", href: "/about" },
    { type: "link", label: "تماس با ما", href: "/contact" },
  ];

  let initialNavIndex = navItems.findIndex((i) => i.type !== "dropdown" && i.href === pathname);
  if (initialNavIndex === -1 && pathname.startsWith("/category")) initialNavIndex = 1;
  if (initialNavIndex === -1) initialNavIndex = 0;

  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [mobileOpen]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/search?q=${encodeURIComponent(search.trim())}`);
      setMobileOpen(false);
    }
  }

  const mobileMenu = mobileOpen && (
    <div className="site-mobile-overlay" onClick={() => setMobileOpen(false)}>
      <div className="site-mobile-panel" onClick={(e) => e.stopPropagation()}>
        <button className="site-mobile-close" onClick={() => setMobileOpen(false)}><X size={22} /></button>
        <form className="site-search" onSubmit={handleSearch}>
          <Search size={16} />
          <input
  type="text"
  id="site-search-input"
  name="search"
  placeholder="جستجوی محصول..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
/>
        </form>

        <Link href="/" onClick={() => setMobileOpen(false)}>خانه</Link>
        {auctionEnabled && (
          <Link href="/auctions" onClick={() => setMobileOpen(false)}>{auctionLabel}</Link>
        )}
        {categories.map((c) => (
          <Link key={c.id} href={`/category/${c.slug}`} onClick={() => setMobileOpen(false)}>{c.name}</Link>
        ))}
        <Link href="/unboxing" onClick={() => setMobileOpen(false)}>
          <Clapperboard size={16} style={{ display: "inline", marginLeft: 6 }} /> آنباکس مشتریان
        </Link>
        <Link href="/bulk-order" onClick={() => setMobileOpen(false)}>سفارش جمعی</Link>
        <Link href="/blog" onClick={() => setMobileOpen(false)}>بلاگ</Link>
        <Link href="/price-ticker" onClick={() => setMobileOpen(false)}>قیمت لحظه‌ای</Link>
        <Link href="/about" onClick={() => setMobileOpen(false)}>درباره ما</Link>
        <Link href="/contact" onClick={() => setMobileOpen(false)}>تماس با ما</Link>

        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 8px" }}>
          <NotificationBell /> <span style={{ fontSize: 14, color: "#374151" }}>اعلان‌ها</span>
        </div>

        <Link href="/cart" onClick={() => setMobileOpen(false)}>سبد خرید</Link>
        <Link href="/wishlist" onClick={() => setMobileOpen(false)}>علاقه‌مندی‌ها</Link>
        <Link href="/profile/orders" onClick={() => setMobileOpen(false)}>
          <PackageSearch size={16} style={{ display: "inline", marginLeft: 6 }} /> پیگیری سفارشتان
        </Link>
        <Link href="/partner/login" onClick={() => setMobileOpen(false)}>
          <Handshake size={16} style={{ display: "inline", marginLeft: 6 }} /> ورود همکاران
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          style={{ background: "none", border: "none", textAlign: "right", width: "100%", cursor: "pointer" }}
        >
          <Scale size={16} style={{ display: "inline", marginLeft: 6 }} /> لیست مقایسه (به‌زودی)
        </button>
        {isLoggedIn ? (
          <>
            <Link href="/profile" onClick={() => setMobileOpen(false)}>پروفایل من</Link>
            <Link href="/profile/orders" onClick={() => setMobileOpen(false)}>سفارشات من</Link>
            <Link href="/profile/loyalty" onClick={() => setMobileOpen(false)}>باشگاه مشتریان</Link>
            <Link href="/unboxing" onClick={() => setMobileOpen(false)}>آنباکس محصولات</Link>
            <Link href="/profile/wallet" onClick={() => setMobileOpen(false)}>
              کیف پول ({walletBalance.toLocaleString("fa-IR")} تومان)
            </Link>
            {isAdmin && <Link href="/admin" onClick={() => setMobileOpen(false)}>پنل مدیریت</Link>}
            <form action={signOut}><button type="submit">خروج</button></form>
          </>
       ) : (
          <>
            <Link href="/login" onClick={() => setMobileOpen(false)}>ورود / ثبت‌نام</Link>
          </>
        )}
      </div>
    </div>
  );

  return (
    <header className="site-header">
      {/* ردیف اول: همان محتوای TopBar سابق */}
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

      {/* ردیف دوم: لوگو + سرچ + سه آیکون */}
      <div className="site-header-inner">
        <Link href="/" className="site-brand-logo" aria-label="سبزفراز - صفحه اصلی">
          {logoUrl && (
            <span className="site-logo-shine-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoUrl} alt="سبزفراز" className="site-logo-img" />
            </span>
          )}
        </Link>

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

        <div className="site-actions">
          <Link href="/wishlist" className="site-icon-btn"><Heart size={20} /></Link>
          <NotificationBell />
          <Link href="/cart" className="site-icon-btn cart-icon-wrap">
            <ShoppingCart size={20} />
            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </Link>
          <button className="site-mobile-toggle" onClick={() => setMobileOpen(true)}><Menu size={22} /></button>
        </div>
      </div>

      {/* ردیف سوم: منوی اصلی (۹ دکمه) */}
      <div className="site-header-nav-row">
        <nav className="site-nav">
          <div className="gooey-nav-wrapper">
            <GooeyNav items={navItems} initialActiveIndex={initialNavIndex} />
          </div>
        </nav>
      </div>

      {mounted && mobileMenu && createPortal(mobileMenu, document.body)}

      <style jsx>{`
        .site-header {
          margin-top: 1cm;
        }

        .site-brand-logo { display: inline-flex; align-items: center; flex-shrink: 0; }
        .site-actions, .site-actions > * { flex-shrink: 0; }

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
          .site-header-topbar { display: none !important; }
        }

        @media (max-width: 400px) {
          .site-header-inner { padding: 0 12px !important; gap: 10px !important; }
          .site-actions { gap: 4px !important; }
          .site-icon-btn { width: 36px !important; height: 36px !important; }
          .site-logo-img { height: 52px !important; }
        }
      `}</style>
    </header>
  );
}