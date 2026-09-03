"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, Package, ShoppingCart, Wallet, Star, MessageCircle, Settings, LogOut, Menu, X } from "lucide-react";
import { partnerSignOut } from "@/app/partner/login/actions";

const nav = [
  { href: "/partner", label: "داشبورد", icon: LayoutDashboard },
  { href: "/partner/products", label: "محصولات من", icon: Package },
  { href: "/partner/orders", label: "سفارش‌ها", icon: ShoppingCart },
  { href: "/partner/wallet", label: "کیف پول", icon: Wallet },
  { href: "/partner/rating", label: "امتیاز من", icon: Star },
  { href: "/partner/support", label: "پشتیبانی", icon: MessageCircle },
  { href: "/partner/settings", label: "تنظیمات پروفایل", icon: Settings },
];

export default function PartnerSidebar({ businessName, logoUrl }: { businessName: string; logoUrl: string | null }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button className="partner-mobile-toggle" onClick={() => setMobileOpen(true)} aria-label="باز کردن منو">
        <Menu size={20} />
      </button>
      {mobileOpen && <div className="partner-overlay" onClick={() => setMobileOpen(false)} />}

      <aside className={`partner-sidebar${mobileOpen ? " open" : ""}`}>
        <div className="partner-sidebar-header">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {logoUrl && <img src={logoUrl} alt={businessName} />}
          <div>
            <div style={{ fontWeight: 800, fontSize: 14 }}>پنل همکار سبزفراز</div>
            <div style={{ fontSize: 11.5, opacity: .7 }}>{businessName}</div>
          </div>
          <button className="partner-mobile-close" onClick={() => setMobileOpen(false)} aria-label="بستن منو"><X size={18} /></button>
        </div>
        <nav className="partner-nav">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className={pathname === item.href ? "active" : ""} onClick={() => setMobileOpen(false)}>
              <item.icon size={17} /> {item.label}
            </Link>
          ))}
        </nav>
        <div style={{ padding: 14 }}>
          <form action={partnerSignOut}>
            <button type="submit" className="partner-btn" style={{ width: "100%", background: "rgba(239,68,68,.15)", color: "#f87171" }}>
              <LogOut size={14} style={{ display: "inline", marginLeft: 6 }} /> خروج
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}