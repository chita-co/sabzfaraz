// src/app/layout.tsx
import { Suspense } from "react";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import Analytics from "./analytics";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://sabzfaraz.vercel.app"
  ),
  title: "سبزفراز | فروشگاه اینترنتی",
  description: "خرید آنلاین انواع کالا از سبزفراز",
  icons: { icon: "/icon.png" },
  verification: {
    google: "BI5RoL6RuvmrwnG5vgJndjwmWQf6Pa9R5ks6E8YSYBw",
    other: {
      "enamad": "17737796",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className={cn("font-sans", geist.variable)}>
      <body className="antialiased">
        <Analytics />
        <Suspense fallback={null}>
          <AnalyticsTracker />
        </Suspense>
        {children}
      </body>
    </html>
  );
}