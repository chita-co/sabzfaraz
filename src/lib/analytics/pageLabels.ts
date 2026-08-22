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

  return pathname; // مسیر ناشناخته — همان مسیر خام نمایش داده می‌شود
}