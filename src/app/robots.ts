// src/app/robots.ts — کل فایل رو با این جایگزین کن:
import { MetadataRoute } from "next";
import { headers } from "next/headers";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get("host") || "";

  // این دامنه فقط برای تقسیم مصرف CPU است؛ محتوای واقعیش زیر sabzfaraz.ir دیده میشه (از طریق rewrite).
  // نباید مستقیم گوگل اینو کراول کنه، ولی این فقط باید برای همین هاست باشه، نه کل دیپلوی.
  if (host.includes("price.sabzfaraz.ir")) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sabzfaraz.ir";
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/profile", "/checkout", "/cart"] }],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}