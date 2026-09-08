import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://sabzfaraz.ir").replace(/\/$/, "");
  const key = process.env.INDEXNOW_KEY;

  if (!key) {
    return NextResponse.json({ error: "INDEXNOW_KEY تنظیم نشده است" }, { status: 500 });
  }

  // دریافت همه صفحات داینامیک از دیتابیس
  const [
  { data: products },
  { data: categories },
  { data: blogPosts },
  { data: blogCategories },
  { data: auctions },
  { data: reverseAuctions },
  { data: partners },
] = await Promise.all([
  supabase.from("products").select("slug").eq("is_active", true).limit(10000),
  supabase.from("categories").select("slug").eq("is_active", true).limit(10000),
  supabase.from("blog_posts").select("slug").eq("status", "published").limit(10000),
  supabase.from("blog_categories").select("slug").eq("status", "active").limit(10000),
  supabase.from("auctions").select("id").eq("status", "active").limit(10000),
  supabase.from("reverse_auctions").select("id").eq("status", "active").limit(10000),
  supabase.from("partners").select("id").eq("is_verified", true).limit(10000),
]);

  const urls: string[] = [];

  // محصولات
  (products ?? []).forEach((p) => urls.push(`${baseUrl}/products/${encodeURIComponent(p.slug)}`));
  // دسته‌بندی‌ها
  (categories ?? []).forEach((c) => urls.push(`${baseUrl}/category/${encodeURIComponent(c.slug)}`));
  // مقالات
  (blogPosts ?? []).forEach((b) => urls.push(`${baseUrl}/blog/${encodeURIComponent(b.slug)}`));
  // دسته‌بندی مقالات
  (blogCategories ?? []).forEach((c) => urls.push(`${baseUrl}/blog/category/${encodeURIComponent(c.slug)}`));

  // حراج‌ها
(auctions ?? []).forEach((a) => urls.push(`${baseUrl}/auctions/${a.id}`));

// حراج‌های معکوس
(reverseAuctions ?? []).forEach((r) => urls.push(`${baseUrl}/reverse-auctions/${r.id}`));

// فروشگاه‌های همکار
(partners ?? []).forEach((p) => urls.push(`${baseUrl}/partner-store/${p.id}`));

  // صفحات ثابت عمومی مهم
  const staticPaths = [
    "/", "/products", "/deals", "/blog", "/price-ticker",
    "/about", "/contact", "/faq", "/newest", "/popular",
    "/stock", "/search", "/auctions", "/reverse-auctions",
    "/bulk-order", "/unboxing", "/support", "/terms", "/privacy",
    "/wishlist", "/cart", "/partner-store",
  ];
  staticPaths.forEach((path) => urls.push(`${baseUrl}${path}`));

  // ارسال به IndexNow
  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        host: baseUrl.replace(/^https?:\/\//, ""),
        key,
        urlList: urls,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `IndexNow error: ${res.status} ${text}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, submittedCount: urls.length });
  } catch (error) {
    console.error("IndexNow submit-all failed:", error);
    return NextResponse.json({ error: "خطا در ارسال به IndexNow" }, { status: 500 });
  }
}