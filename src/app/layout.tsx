// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://sabzfaraz.vercel.app"
  ),
  title: "17737796",   // ← موقت
  description: "خرید آنلاین انواع کالا از سبزفراز",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className={cn("font-sans", geist.variable)}>
      <head>
        <meta
          name="google-site-verification"
          content="BI5RoL6RuvmrwnG5vgJndjwmWQf6Pa9R5ks6E8YSYBw"
        />
        {/* Google Analytics */}
        <meta name="enamad" content="17737796" />
  <script
    async
    src={`https://www.googletagmanager.com/gtag/js?id=G-XD80X219VE`}
  />
  <script
    dangerouslySetInnerHTML={{
      __html: `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-XXXXXXXXXX');
      `,
    }}
  />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}