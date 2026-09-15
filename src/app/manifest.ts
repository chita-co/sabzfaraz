import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "سبزفراز | فروشگاه اینترنتی قطعات الکترونیک",
    short_name: "سبزفراز",
    description: "خرید آنلاین انواع قطعات الکترونیکی از سبزفراز",
    start_url: "/",
    display: "standalone",
    background_color: "#14532d",
    theme_color: "#14532d",
    icons: [
      { src: "/icon.png", sizes: "192x192", type: "image/png" },
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
  };
}