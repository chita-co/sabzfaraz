import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp"],
  turbopack: {
    root: __dirname,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "s3.ir-thr-at1.arvanstorage.ir" },
      { protocol: "https", hostname: "**.arvanstorage.ir" },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  async rewrites() {
    // فقط روی حساب اصلی (Vercel 1) فعال است.
    // روی حساب دوم (Vercel 2) این متغیر را true می‌کنیم تا rewrites غیرفعال شوند.
    if (process.env.IS_HEAVY_ACCOUNT === "true") {
      return [];
    }
    return [
      {
        source: "/price-ticker",
        destination: "https://price.sabzfaraz.ir/price-ticker",
      },
      {
        source: "/price-ticker/:path*",
        destination: "https://price.sabzfaraz.ir/price-ticker/:path*",
      },
      {
        source: "/api/price-ticker/:path*",
        destination: "https://price.sabzfaraz.ir/api/price-ticker/:path*",
      },
      {
        source: "/blog",
        destination: "https://price.sabzfaraz.ir/blog",
      },
      {
        source: "/blog/:path*",
        destination: "https://price.sabzfaraz.ir/blog/:path*",
      },
      {
        source: "/api/blog/:path*",
        destination: "https://price.sabzfaraz.ir/api/blog/:path*",
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https: wss://jzloltboghlebbbmlgwn.supabase.co https://www.google-analytics.com https://www.googletagmanager.com https://price.sabzfaraz.ir; frame-src 'self' https://sabzfaraz.vercel.app https://price.sabzfaraz.ir;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;