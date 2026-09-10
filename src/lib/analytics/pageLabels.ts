const STATIC_PAGE_LABELS: Record<string, string> = {
  "/": "صفحه اصلی",
  "/products": "لیست همه محصولات",
  "/cart": "سبد خرید",
  "/checkout": "تسویه‌حساب",
  "/wishlist": "علاقه‌مندی‌ها",
  "/profile": "پروفایل کاربری",
  "/profile/orders": "سفارش‌های من",
  "/profile/loyalty": "باشگاه مشتریان",
  "/profile/bulk-orders": "سفارش‌های جمعی من",
  "/login": "صفحه ورود",
  "/register": "صفحه ثبت‌نام",
  "/forgot-password": "فراموشی رمز عبور",
  "/unboxing": "گالری آنباکس",
  "/bulk-order": "سفارش جمعی",
  "/bulk-order/new": "ثبت سفارش جمعی جدید",
  "/search": "نتایج جستجو",
  "/deals": "جشنواره تخفیف",
  "/newest": "جدیدترین محصولات",
  "/popular": "محصولات پرطرفدار",
  "/stock": "محصولات استوک",
  "/about": "درباره ما",
  "/contact": "تماس با ما",
  "/faq": "سوالات متداول",
  "/terms": "قوانین و مقررات",
  "/privacy": "حریم خصوصی",
  "/support": "پشتیبانی",
  "/auctions": "حراج‌ها",
  "/reverse-auctions": "حراج معکوس",
  "/blog": "وبلاگ",
  "/calendar": "تقویم و رویدادها",
  "/price-ticker": "قیمت لحظه‌ای",
  "/profile/wallet": "کیف پول من",
  "/profile/auctions": "حراج‌های من",
  "/enamad-verify": "تأیید اینماد",
  "/partner-store": "فروشگاه همکاران",
};

export function extractPathname(rawUrl: string): string {
  try {
    return new URL(rawUrl).pathname;
  } catch {
    return rawUrl || "—";
  }
}

export function translatePageLabel(
  rawUrl: string | null,
  productNames: Map<string, string>,
  categoryNames: Map<string, string>
): string {
  if (!rawUrl || rawUrl === "—") return "—";
  const pathname = extractPathname(rawUrl).replace(/\/$/, "") || "/";

  if (STATIC_PAGE_LABELS[pathname]) return STATIC_PAGE_LABELS[pathname];

  const productMatch = pathname.match(/^\/products\/([^/]+)$/);
  if (productMatch) {
    const name = productNames.get(productMatch[1]);
    return name ? `صفحه محصول: ${name}` : "صفحه محصول";
  }

  const categoryMatch = pathname.match(/^\/category\/([^/]+)$/);
  if (categoryMatch) {
    const name = categoryNames.get(categoryMatch[1]);
    return name ? `دسته‌بندی: ${name}` : "صفحه دسته‌بندی";
  }

  if (pathname.startsWith("/admin")) return "پنل مدیریت";
  if (pathname.startsWith("/order/")) return "جزئیات سفارش";
  if (pathname.startsWith("/bulk-order/")) return "جزئیات سفارش جمعی";
  if (pathname.startsWith("/support/")) return "گفتگوی پشتیبانی";
  if (pathname.startsWith("/blog/category/")) return "دسته‌بندی وبلاگ";
  if (pathname.startsWith("/blog/")) return "مقاله وبلاگ";
  if (pathname.startsWith("/auctions/")) return "جزئیات حراج";
  if (pathname.startsWith("/reverse-auctions/")) return "جزئیات حراج معکوس";
  if (pathname.startsWith("/partner-store/")) return "فروشگاه همکار";
  if (pathname.startsWith("/calendar/event/")) return "جزئیات رویداد تقویم";
  if (pathname.match(/^\/calendar\/\d+\/\d+\/\d+$/)) return "روز تقویم";
  if (pathname.startsWith("/profile/orders/")) return "جزئیات سفارش من";
  if (pathname.startsWith("/profile/bulk-orders")) return "سفارش جمعی من";
  if (pathname.startsWith("/profile/wallet")) return "کیف پول من";
  if (pathname.startsWith("/profile/loyalty")) return "باشگاه مشتریان";
  if (pathname.startsWith("/profile/auctions")) return "حراج‌های من";
  if (pathname.startsWith("/partner/")) return "پنل همکاران";

  return pathname; // مسیر ناشناخته — همان مسیر خام نمایش داده می‌شود
}