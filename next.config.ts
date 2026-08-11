import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "s3.ir-thr-at1.arvanstorage.ir" },
      { protocol: "https", hostname: "**.arvanstorage.ir" },
    ],
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "sabzfaraz.vercel.app",
          },
        ],
        destination: "https://sabzfaraz.ir/:path*",
        permanent: true, // 301 redirect
      },
    ];
  },
};

export default nextConfig;