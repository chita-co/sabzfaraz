// src/app/layout.tsx
import { Suspense } from "react";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import Analytics from "./analytics";
import { Toaster } from "react-hot-toast";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://sabzfaraz.ir"
  ),
  title: "سبزفراز | فروشگاه اینترنتی",
  description: "خرید آنلاین انواع کالا از سبزفراز",
  icons: { icon: "/icon.png" },
  verification: {
    google: "BI5RoL6RuvmrwnG5vgJndjwmWQf6Pa9R5ks6E8YSYBw",
    other: {
      "enamad": "17737796",
      "msvalidate.01": "0147EAAA6AFD09373328DA12666E26BF",
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
      <head>
        {/* تأیید گوگل سرچ کنسول برای دامنه جدید sabzfaraz.ir */}
        <meta
          name="google-site-verification"
          content="zLktSAGcXPkl_HBvejo3FzUOp4OOWNU8v3QXbuF-kB8"
        />

        {/* اسکیما برای شبکه‌های اجتماعی و معرفی برند */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "سبزفراز",
              url: "https://sabzfaraz.ir",
              logo: "https://sabzfaraz.ir/icon.png",
              sameAs: [
                "https://www.instagram.com/sabz.faraz",
                "https://www.youtube.com/@sabz-faraz",
                "https://www.aparat.com/sabzfaraz",
              ],
            }),
          }}
        />
      </head>
      <body className="antialiased">
        <Analytics />
        <Toaster position="bottom-center" reverseOrder={false} />
        <Suspense fallback={null}>
          <AnalyticsTracker />
        </Suspense>
        {children}
      </body>
    </html>
  );
}