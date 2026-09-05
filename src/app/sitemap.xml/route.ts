import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 3600;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const supabase = await createClient();
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://sabzfaraz.ir").replace(/\/$/, "");

  const [{ data: products }, { data: categories }, { data: blogPosts }, { data: blogCategories }] = await Promise.all([
    supabase.from("products").select("slug, updated_at").eq("is_active", true),
    supabase.from("categories").select("slug").eq("is_active", true),
    supabase.from("blog_posts").select("slug, published_at").eq("status", "published"),
    supabase.from("blog_categories").select("slug").eq("status", "active"),
  ]);

  const staticUrls = [
    { loc: `${baseUrl}/`, changefreq: "daily", priority: "1.0" },
    { loc: `${baseUrl}/products`, changefreq: "daily", priority: "0.9" },
    { loc: `${baseUrl}/deals`, changefreq: "daily", priority: "0.8" },
    { loc: `${baseUrl}/blog`, changefreq: "daily", priority: "0.8" },
    { loc: `${baseUrl}/price-ticker`, changefreq: "always", priority: "0.9" },
    { loc: `${baseUrl}/about`, changefreq: "monthly", priority: "0.5" },
    { loc: `${baseUrl}/contact`, changefreq: "monthly", priority: "0.5" },
    { loc: `${baseUrl}/faq`, changefreq: "monthly", priority: "0.4" },
    // new public shop routes
    { loc: `${baseUrl}/newest`, changefreq: "daily", priority: "0.8" },
    { loc: `${baseUrl}/popular`, changefreq: "daily", priority: "0.8" },
    { loc: `${baseUrl}/stock`, changefreq: "daily", priority: "0.8" },
    { loc: `${baseUrl}/search`, changefreq: "weekly", priority: "0.6" },
    { loc: `${baseUrl}/auctions`, changefreq: "daily", priority: "0.8" },
    { loc: `${baseUrl}/reverse-auctions`, changefreq: "daily", priority: "0.7" },
    { loc: `${baseUrl}/bulk-order`, changefreq: "weekly", priority: "0.6" },
    { loc: `${baseUrl}/unboxing`, changefreq: "weekly", priority: "0.6" },
    { loc: `${baseUrl}/support`, changefreq: "weekly", priority: "0.5" },
    { loc: `${baseUrl}/terms`, changefreq: "monthly", priority: "0.4" },
    { loc: `${baseUrl}/privacy`, changefreq: "monthly", priority: "0.4" },
    { loc: `${baseUrl}/wishlist`, changefreq: "monthly", priority: "0.2" },
    { loc: `${baseUrl}/cart`, changefreq: "monthly", priority: "0.2" },
  ];

  const productUrls = (products ?? []).map((p) => ({
    loc: `${baseUrl}/products/${encodeURIComponent(p.slug)}`,
    lastmod: p.updated_at ? new Date(p.updated_at).toISOString() : undefined,
    changefreq: "weekly",
    priority: "0.8",
  }));

  const categoryUrls = (categories ?? []).map((c) => ({
    loc: `${baseUrl}/category/${encodeURIComponent(c.slug)}`,
    changefreq: "weekly",
    priority: "0.7",
  }));

  const blogUrls = (blogPosts ?? []).map((p) => ({
    loc: `${baseUrl}/blog/${encodeURIComponent(p.slug)}`,
    lastmod: p.published_at ? new Date(p.published_at).toISOString() : undefined,
    changefreq: "weekly",
    priority: "0.7",
  }));

  const blogCategoryUrls = (blogCategories ?? []).map((c) => ({
    loc: `${baseUrl}/blog/category/${encodeURIComponent(c.slug)}`,
    changefreq: "weekly",
    priority: "0.6",
  }));

  const allUrls = [...staticUrls, ...productUrls, ...categoryUrls, ...blogUrls, ...blogCategoryUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
${"lastmod" in u && u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>\n` : ""}    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}