import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp"],
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "s3.ir-thr-at1.arvanstorage.ir" },
      { protocol: "https", hostname: "**.arvanstorage.ir" },
    ],
  },
};

export default nextConfig;