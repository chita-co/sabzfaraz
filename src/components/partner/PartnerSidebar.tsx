"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ShoppingCart, Wallet, Star, LogOut , MessageCircle } from "lucide-react";
import { partnerSignOut } from "@/app/partner/login/actions";

const nav = [
  { href: "/partner", label: "داشبورد", icon: LayoutDashboard },
  { href: "/partner/products", label: "محصولات من", icon: Package },
  { href: "/partner/orders", label: "سفارش‌ها", icon: ShoppingCart },
  { href: "/partner/wallet", label: "کیف پول", icon: Wallet },
  { href: "/partner/rating", label: "امتیاز من", icon: Star },
  { href: "/partner/support", label: "پشتیبانی", icon: MessageCircle }, // MessageCircle رو به ایمپورت lucide-react بالای فایل اضافه کن
];

export default function PartnerSidebar({ businessName, logoUrl }: { businessName: string; logoUrl: string | null }) {
  const pathname = usePathname();
  return (
    <aside className="partner-sidebar">
      <div className="partner-sidebar-header">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {logoUrl && <img src={logoUrl} alt={businessName} />}
        <div>
          <div style={{ fontWeight: 800, fontSize: 14 }}>پنل همکار سبزفراز</div>
          <div style={{ fontSize: 11.5, opacity: .7 }}>{businessName}</div>
        </div>
      </div>
      <nav className="partner-nav">
        {nav.map((item) => (
          <Link key={item.href} href={item.href} className={pathname === item.href ? "active" : ""}>
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
  );
}