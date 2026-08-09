"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, ShoppingCart, Heart, User, Menu, X, ChevronDown,
  LayoutDashboard, LogOut, Package, Gift, Clapperboard,
} from "lucide-react";
import { signOut } from "@/app/(auth)/actions";
import { useCartTotals } from "@/store/cart-store";
import { usePathname } from "next/navigation";
import ShinyText from "@/components/ShinyText";
import GooeyNav from "@/components/GooeyNav";
import NotificationBell from "@/components/shop/NotificationBell";

interface CategoryLite { id: string; name: string; slug: string; }

export default function HeaderNav({
  isLoggedIn, userName, isAdmin, categories, logoUrl,
}: {
  isLoggedIn: boolean;
  userName: string | null;
  isAdmin: boolean;
  categories: CategoryLite[];
  logoUrl?: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { totalItems } = useCartTotals();

  const gooeyItems = [
    { label: "خانه", href: "/" },
    { label: "آنباکس", href: "/unboxing" },
    { label: "سفارش جمعی", href: "/bulk-order" },
    { label: "درباره ما", href: "/about" },
    { label: "تماس با ما", href: "/contact" },
    { label: "پشتیبانی", href: "/support" },
  ];
  const initialNavIndex = Math.max(0, gooeyItems.findIndex((i) => i.href === pathname));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
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
        <Link href="/" className="site-logo">
          {logoUrl && (
            <span className="site-logo-shine-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoUrl} alt="سبزفراز" className="site-logo-img" />
            </span>
          )}
          <ShinyText
            text="سبزفراز"
            color="#ffffff"
            shineColor="#fde047"
            speed={2.5}
            spread={90}
            className="site-logo-text"
          />
        </Link>

        <nav className="site-nav">
          <div className="site-nav-dropdown" onMouseEnter={() => setCatOpen(true)} onMouseLeave={() => setCatOpen(false)}>
            <button type="button">دسته‌بندی‌ها <ChevronDown size={14} /></button>
            {catOpen && (
              <div className="site-dropdown-menu">
                {categories.map((c) => (
                  <Link key={c.id} href={`/category/${c.slug}`}>{c.name}</Link>
                ))}
              </div>
            )}
          </div>
          <div className="gooey-nav-wrapper">
            <GooeyNav items={gooeyItems} initialActiveIndex={initialNavIndex} />
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
          
          {/* فقط یک لینک سبد خرید باید وجود داشته باشد */}
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

      {/* ===== منوی موبایل ===== */}
      {mobileOpen && (
        <div className="site-mobile-overlay" onClick={() => setMobileOpen(false)}>
          <div className="site-mobile-panel" onClick={(e) => e.stopPropagation()}>
            <button className="site-mobile-close" onClick={() => setMobileOpen(false)}><X size={22} /></button>
            <form className="site-search" onSubmit={handleSearch}>
              <Search size={16} />
              <input type="text" placeholder="جستجوی محصول..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </form>
            <Link href="/" onClick={() => setMobileOpen(false)}>خانه</Link>
            <Link href="/unboxing" onClick={() => setMobileOpen(false)}>
              <Clapperboard size={16} style={{ display: "inline", marginLeft: 6 }} /> آنباکس مشتریان
            </Link>
            {categories.map((c) => (
              <Link key={c.id} href={`/category/${c.slug}`} onClick={() => setMobileOpen(false)}>{c.name}</Link>
            ))}
            <Link href="/about" onClick={() => setMobileOpen(false)}>درباره ما</Link>
            <Link href="/contact" onClick={() => setMobileOpen(false)}>تماس با ما</Link>
            <Link href="/support" onClick={() => setMobileOpen(false)}>پشتیبانی</Link>
            
            {/* NotificationBell به‌عنوان یک آیتم مستقل در موبایل */}
            <NotificationBell />
            
            <Link href="/cart" onClick={() => setMobileOpen(false)}>سبد خرید</Link>
            <Link href="/wishlist" onClick={() => setMobileOpen(false)}>علاقه‌مندی‌ها</Link>
            {isLoggedIn ? (
              <>
                <Link href="/profile" onClick={() => setMobileOpen(false)}>پروفایل من</Link>
                <Link href="/profile/orders" onClick={() => setMobileOpen(false)}>سفارشات من</Link>
                <Link href="/profile/loyalty" onClick={() => setMobileOpen(false)}>باشگاه مشتریان</Link>
                <Link href="/unboxing" onClick={() => setMobileOpen(false)}>آنباکس محصولات</Link>
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