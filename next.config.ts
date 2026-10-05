import type { NextConfig } from "next";

process.env.TZ = "Asia/Tehran";


// استخراج host ساپابیس از env (هر محیط خودش رو می‌خونه)
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host
  : "";

const cspConnectSrc = [
  "'self'",
  "https:",
  supabaseHost ? `wss://${supabaseHost}` : "",
  "https://www.google-analytics.com",
  "https://www.googletagmanager.com",
].filter(Boolean).join(" ");

const nextConfig: NextConfig = {
  output: 'standalone',
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


  // ✅ این بخش جدید اضافه شده
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.sabzfaraz.ir' }],
        destination: 'https://sabzfaraz.ir/:path*',
        permanent: true,
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
              `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://www.instagram.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; font-src 'self' https://fonts.gstatic.com; connect-src ${cspConnectSrc}; frame-src 'self' https://sabzfaraz.vercel.app https://www.aparat.com https://www.youtube.com https://www.youtube-nocookie.com https://www.instagram.com;`,
          },
        ],
      },
    ];
  },
};

export default nextConfig;