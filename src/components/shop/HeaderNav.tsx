"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Search, ShoppingCart, Heart, User, Menu, X,
  LayoutDashboard, LogOut, Package, Gift, Clapperboard, Wallet,
} from "lucide-react";
import { signOut } from "@/app/(auth)/actions";
import { useCartTotals } from "@/store/cart-store";
import GooeyNav, { type GooeyNavItem } from "@/components/GooeyNav";
import NotificationBell from "@/components/shop/NotificationBell";

interface CategoryLite { id: string; name: string; slug: string; }
interface CategoryTreeItem extends CategoryLite { children: CategoryLite[]; }

export default function HeaderNav({
  isLoggedIn, userName, isAdmin, categories, categoryTree, logoUrl, walletBalance = 0, auctionEnabled = true, auctionLabel = "جمعه بازار",
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
          <input type="text" placeholder="جستجوی محصول..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
      <div className="site-header-inner">
        <Link href="/" className="site-brand-logo" aria-label="سبزفراز - صفحه اصلی">
          {logoUrl && (
            <span className="site-logo-shine-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoUrl} alt="سبزفراز" className="site-logo-img" />
            </span>
          )}
        </Link>

        <nav className="site-nav">
          <div className="gooey-nav-wrapper">
            <GooeyNav items={navItems} initialActiveIndex={initialNavIndex} />
          </div>
        </nav>

        <form className="site-search" onSubmit={handleSearch}>
          <Search size={16} />
          <input type="text" placeholder="جستجوی محصول..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </form>

        <div className="site-actions">
          <Link href="/wishlist" className="site-icon-btn"><Heart size={20} /></Link>
          <NotificationBell />

          <Link href="/cart" className="site-icon-btn cart-icon-wrap">
            <ShoppingCart size={20} />
            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </Link>

          <div className="site-nav-dropdown" onMouseEnter={() => setAccountOpen(true)} onMouseLeave={() => setAccountOpen(false)}>
            {isLoggedIn ? (
              <>
                <button type="button" className="site-icon-btn"><User size={20} /></button>
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
              </>
            ) : (
              <Link href="/login" className="site-login-btn">ورود / ثبت‌نام</Link>
            )}
          </div>

          <button className="site-mobile-toggle" onClick={() => setMobileOpen(true)}><Menu size={22} /></button>
        </div>
      </div>

      {mounted && mobileMenu && createPortal(mobileMenu, document.body)}

      <style jsx>{`
        .site-brand-logo { display: inline-flex; align-items: center; flex-shrink: 0; }
        .site-actions, .site-actions > * { flex-shrink: 0; }

        /* دسکتاپ کامل تا میانه (بالای ۱۰۲۴): بدون هیچ تغییری نسبت به قبل - فقط اسکرول
           افقی داخل همان ردیف واحد هدر */
        @media (max-width: 1400px) and (min-width: 1025px) {
          .site-header-inner { flex-wrap: nowrap !important; gap: 8px !important; }
          .site-nav {
            overflow-x: auto !important;
            overflow-y: hidden !important;
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
            flex-shrink: 1 !important;
            min-width: 0 !important;
          }
          .site-nav::-webkit-scrollbar { display: none !important; }
          .gooey-nav-wrapper { flex-shrink: 0 !important; }
          .site-search { flex-shrink: 0 !important; min-width: 150px !important; }
          .site-actions { flex-shrink: 0 !important; gap: 6px !important; }
        }
        

        /* بازه‌ی میانی جدید (۶۴۱ تا ۱۰۲۴): به‌جای پنهان شدن پشت همبرگر، منو و سرچ در
           ردیف‌های جداگانه‌ی زیر آیکون‌ها نمایش داده می‌شوند و اسکرول‌پذیرند. */
        @media (max-width: 1150px) and (min-width: 641px) {
          .site-header-inner {
            flex-wrap: wrap !important;
            height: auto !important;
            padding: 12px 16px !important;
            row-gap: 10px !important;
          }
          .site-nav {
            order: 3 !important;
            width: 100% !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
            scrollbar-width: none !important;
          }
          .site-nav::-webkit-scrollbar { display: none !important; }
          .gooey-nav-wrapper { flex-shrink: 0 !important; }
          .site-search {
            order: 4 !important;
            width: 100% !important;
            max-width: none !important;
          }
        }

        /* موبایل خیلی کوچک */
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