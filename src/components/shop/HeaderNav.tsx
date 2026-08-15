"use client";

import { useState } from "react";
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

export default function HeaderNav({
  isLoggedIn, userName, isAdmin, categories, logoUrl, walletBalance = 0, auctionEnabled = true, auctionLabel = "جمعه بازار ",
}: {
  isLoggedIn: boolean;
  userName: string | null;
  isAdmin: boolean;
  categories: CategoryLite[];
  logoUrl?: string | null;
  walletBalance?: number;
  auctionEnabled?: boolean;
  auctionLabel?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { totalItems } = useCartTotals();

  // آیتم‌های داخل پیل هدر (لوگو دیگر اینجا نیست، جدا از منو رندر می‌شود)
  // ترتیب: سبزفراز / دسته‌بندی‌ها / جمعه بازار (صفحه مزایده) / آنباکس / سفارش جمعی / درباره ما / تماس با ما
  const navItems: GooeyNavItem[] = [
    { type: "link", label: "سبزفراز", href: "/", shiny: true },
    {
      type: "dropdown",
      label: "دسته‌بندی‌ها",
      children: categories.map((c) => ({ label: c.name, href: `/category/${c.slug}` })),
    },
    ...(auctionEnabled ? [{ type: "link" as const, label: auctionLabel, href: "/auctions" }] : []),
    { type: "link", label: "آنباکس", href: "/unboxing" },
    { type: "link", label: "سفارش جمعی", href: "/bulk-order" },
    { type: "link", label: "درباره ما", href: "/about" },
    { type: "link", label: "تماس با ما", href: "/contact" },
  ];

  let initialNavIndex = navItems.findIndex((i) => i.type !== "dropdown" && i.href === pathname);
  if (initialNavIndex === -1 && pathname.startsWith("/category")) initialNavIndex = 1;
  if (initialNavIndex === -1) initialNavIndex = 0;

  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [search, setSearch] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/search?q=${encodeURIComponent(search.trim())}`);
      setMobileOpen(false);
    }
  }
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <nav className="site-nav">
          {/* ===== لوگوی رنگی دایره‌ای — بیرون از پیل منو ===== */}
          <Link href="/" className="site-brand-logo" aria-label="سبزفراز - صفحه اصلی">
            {logoUrl && (
              <span className="site-logo-shine-wrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoUrl} alt="سبزفراز" className="site-logo-img" />
              </span>
            )}
          </Link>

          <div className="gooey-nav-wrapper">
            <GooeyNav items={navItems} initialActiveIndex={initialNavIndex} />
          </div>
        </nav>

        <form className="site-search" onSubmit={handleSearch}>
          <Search size={16} />
          <input type="text" placeholder="جستجوی محصول..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </form>

        {/* ===== بخش اصلی دکمه‌های هدر (دسکتاپ) ===== */}
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
                    <Link href="/profile/orders">
                      <Package size={14} /> سفارشات من
                    </Link>
                    <Link href="/profile/loyalty">
                      <Gift size={14} /> باشگاه مشتریان
                    </Link>
                    <Link href="/unboxing">
                      <Clapperboard size={14} /> آنباکس محصولات
                    </Link>
                    <Link href="/profile/wallet">
                      <Wallet size={14} /> کیف پول ({walletBalance.toLocaleString("fa-IR")} تومان)
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" className="site-dropdown-admin">
                        <LayoutDashboard size={14} /> پنل مدیریت
                      </Link>
                    )}
                    <form action={signOut}>
                      <button type="submit" className="site-dropdown-logout">
                        <LogOut size={14} /> خروج
                      </button>
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

      {/* ===== منوی موبایل (بدون تغییر نسبت به قبل) ===== */}
      {mobileOpen && (
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
            <Link href="/about" onClick={() => setMobileOpen(false)}>درباره ما</Link>
            <Link href="/contact" onClick={() => setMobileOpen(false)}>تماس با ما</Link>

            <NotificationBell />

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
              <Link href="/login" onClick={() => setMobileOpen(false)}>ورود / ثبت‌نام</Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}