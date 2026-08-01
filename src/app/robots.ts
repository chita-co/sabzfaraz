import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sabzfaraz.vercel.app";
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/profile", "/checkout", "/cart"] }],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}