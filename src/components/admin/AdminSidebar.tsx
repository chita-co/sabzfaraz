"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Wallet,
  Settings,
  Menu,
  X,
  Crown,
  ChevronDown,
  MessageCircle,
  Gift,
  Film,
  Gavel,
} from "lucide-react";
import { signOut } from "@/app/(auth)/actions";
import PendingWalletBadge from "./PendingWalletBadge";

interface NavChild {
  href: string;
  label: string;
}

interface NavGroup {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  children: NavChild[];
}

interface NavLink {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}

type NavItem = NavGroup | NavLink;

function isGroup(item: NavItem): item is NavGroup {
  return "children" in item;
}

const navConfig: NavItem[] = [
  { href: "/admin", label: "داشبورد", icon: LayoutDashboard },
  { href: "/admin/support", label: "پشتیبانی", icon: MessageCircle },
  {
    id: "users",
    label: "کاربران",
    icon: Users,
    children: [
      { href: "/admin/users", label: "مدیریت کاربران" },
      { href: "/admin/users/new", label: "افزودن کاربر" },
      { href: "/admin/users/roles", label: "نقش‌ها" },
    ],
  },
  {
    id: "products",
    label: "محصولات",
    icon: Package,
    children: [
      { href: "/admin/products", label: "لیست محصولات" },
      { href: "/admin/products/new", label: "افزودن محصول" },
      { href: "/admin/categories", label: "دسته‌بندی‌ها" },
      { href: "/admin/deals", label: "جشنواره تخفیف" },
      { href: "/admin/banners", label: "بنرهای اسلایدی" },
      { href: "/admin/reviews", label: "نظرات و امتیازها" },
      { href: "/admin/stock", label: "محصولات استوک" },
      { href: "/admin/out-of-stock", label: "محصولات تمام‌شده" },
    ],
  },
  {
    id: "orders",
    label: "سفارش‌ها",
    icon: ShoppingCart,
    children: [
      { href: "/admin/orders", label: "همه سفارش‌ها" },
      { href: "/admin/finance/invoices", label: "مدیریت فاکتورها" },
      { href: "/admin/bulk-orders", label: "سفارشات جمعی" },
    ],
  },
  {
    id: "finance",
    label: "مالی",
    icon: Wallet,
    children: [
      { href: "/admin/finance/transactions", label: "تراکنش‌ها" },
      { href: "/admin/finance/wallet-transactions", label: "تراکنش‌های کیف پول" },
      { href: "/admin/finance/wallet-withdrawals", label: "برداشت کیف پول (تسویه)" },
      { href: "/admin/finance/wallet-topups-history", label: "تاریخچه شارژهای تأییدشده" },
      { href: "/admin/analytics", label: "گزارش فروش" },
      { href: "/admin/analytics-visitors", label: "آمار بازدیدکنندگان" },
    ],
  },
  {
    id: "loyalty",
    label: "باشگاه مشتریان",
    icon: Gift,
    children: [
      { href: "/admin/loyalty/settings", label: "تنظیمات امتیازدهی" },
      { href: "/admin/loyalty/tiers", label: "سطوح مشتریان" },
      { href: "/admin/loyalty/transactions", label: "دفتر کل امتیازها" },
    ],
  },
  {
    id: "auctions",
    label: "مزایده و جمعه بازار",
    icon: Gavel,
    children: [
      { href: "/admin/auctions", label: "لیست مزایده‌ها" },
      { href: "/admin/auctions/new", label: "مزایده جدید" },
      { href: "/admin/auction-bots", label: "ربات‌های پیشنهاددهنده" },
      { href: "/admin/reverse-auctions", label: "جمعه بازار (حراج معکوس)" },
      { href: "/admin/reverse-auctions/new", label: "کالای جدید جمعه بازار" },
      { href: "/admin/wallet-requests", label: "درخواست‌های شارژ کیف پول" },
      { href: "/admin/auction-reputation", label: "اعتبار و لیست سیاه کاربران" },
      { href: "/admin/auction-settings", label: "تنظیمات مزایده و کیف پول" },
    ],
  },
  { href: "/admin/unboxing", label: "ویدیوهای آنباکس", icon: Film },
  {
    id: "settings", label: "تنظیمات", icon: Settings,
    children: [
      { href: "/admin/settings/general", label: "تنظیمات عمومی" },
      { href: "/admin/shipping", label: "هزینه ارسال" },
      { href: "/admin/tracking-settings", label: "پیام‌های پیگیری" },
      { href: "/admin/shipping-methods", label: "روش‌های ارسال (وزنی)" },
      { href: "/admin/site-settings", label: "لوگو و بنر سایت" },
      { href: "/admin/settings/backup", label: "پشتیبان‌گیری" },
      { href: "/admin/settings/bank-accounts", label: "حساب‌های بانکی" },
    ],
  },
];

export default function AdminSidebar({
  adminName,
}: {
  adminName: string | null;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeGroupId = navConfig.find(
    (item) => isGroup(item) && item.children.some((c) => c.href === pathname)
  ) as NavGroup | undefined;

  const [openGroups, setOpenGroups] = useState<string[]>(
    activeGroupId ? [activeGroupId.id] : []
  );

  function toggleGroup(id: string) {
    setOpenGroups((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  }

  return (
    <>
      <button
        className="admin-mobile-toggle"
        onClick={() => setMobileOpen(true)}
      >
        <Menu size={22} />
      </button>

      {mobileOpen && (
        <div className="admin-overlay" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`admin-sidebar${mobileOpen ? " open" : ""}`}>
        <div className="admin-sidebar-header">
          <div className="admin-logo">
            <Crown size={20} />
          </div>
          <div>
            <h2>پنل ادمین</h2>
            <p>{adminName || "مدیر سیستم"}</p>
          </div>
          <button
            className="admin-mobile-close"
            onClick={() => setMobileOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="admin-nav">
          {navConfig.map((item) => {
            const Icon = item.icon;

            if (!isGroup(item)) {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`admin-nav-item${active ? " active" : ""}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            }

            const open = openGroups.includes(item.id);
            return (
              <div
                key={item.id}
                className={`admin-nav-group${open ? " open" : ""}`}
              >
                <button
                  type="button"
                  className="admin-nav-group-toggle"
                  onClick={() => toggleGroup(item.id)}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                  <ChevronDown size={15} className="chevron" />
                </button>
                <div className="admin-nav-submenu">
                  <div>
                    {item.children.map((child) => {
                      const active = pathname === child.href;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`admin-nav-item${active ? " active" : ""}`}
                          onClick={() => setMobileOpen(false)}
                        >
                          <span>{child.label}</span>
                          {child.href === "/admin/wallet-requests" && <PendingWalletBadge />}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>
        <div className="admin-sidebar-footer">
          <Link href="/" className="admin-back-link">
            بازگشت به فروشگاه
          </Link>
          <form action={signOut}>
            <button type="submit" className="admin-logout-btn">
              خروج
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}