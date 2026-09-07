// src/app/(shop)/قیمت-لحظه-ای-طلا-دلار/page.tsx
//
// این صفحه داخل گروه (shop) قرار دارد پس به‌صورت خودکار Header و Footer سایت
// (src/app/(shop)/layout.tsx) را می‌گیرد — هیچ فایل دیگری لازم نیست دست بخورد.

import type { Metadata } from "next";
import { getPriceSnapshot } from "@/lib/priceTicker/cache";
import PriceTickerDashboard from "@/components/price-ticker/PriceTickerDashboard";
import PriceTickerFaq from "@/components/price-ticker/PriceTickerFaq";
import { PRICE_TICKER_FAQS } from "@/components/price-ticker/priceTickerFaqs";
import GalaxyBackground from "@/components/backgrounds/GalaxyBackground";

export const dynamic = 'force-dynamic';


// هر ۳۰ ثانیه HTML صفحه در پس‌زمینه تازه می‌شود (ISR) — سریع برای کاربر و
// سئو، و سبک برای پلن رایگان Vercel (نه یک تابع سرورلس در هر بازدید).
export const revalidate = 30;

const description =
  "مشاهده قیمت لحظه‌ای دلار، یورو، سکه امامی، طلای ۱۸ عیار و برترین ارزهای دیجیتال به‌همراه نمودار تغییرات، ماشین‌حساب طلا و سکه، هشدار قیمت و اشتراک‌گذاری آسان.";

function todayFa(): string {
  return new Date().toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" });
}

export async function generateMetadata(): Promise<Metadata> {
  const title = `قیمت لحظه‌ای دلار، طلا و سکه امروز ${todayFa()} | سبزفراز`;

  return {
    title,
    description,
    alternates: { canonical: "/price-ticker" },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "fa_IR",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function PriceTickerPage() {
  const snapshot = await getPriceSnapshot();
  const updatedAtFa = new Date(snapshot.updatedAt).toLocaleString("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://sabzfaraz.ir").replace(/\/$/, "");
  const pageUrl = `${siteUrl}/price-ticker`;

  const datasetSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "قیمت لحظه‌ای طلا، دلار، سکه و ارز دیجیتال",
    description,
    url: pageUrl,
    temporalCoverage: snapshot.updatedAt,
    variableMeasured: [
      "قیمت دلار آمریکا", "قیمت یورو", "قیمت طلای ۱۸ عیار", "قیمت سکه امامی", "قیمت بیت‌کوین", "قیمت اتریوم", "قیمت تتر",
    ],
  };

  const financialProductSchema = {
    "@context": "https://schema.org",
    "@type": "FinancialProduct",
    name: "نرخ لحظه‌ای ارز، طلا و ارز دیجیتال",
    url: pageUrl,
    provider: { "@type": "Organization", name: "سبزفراز", url: siteUrl },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: PRICE_TICKER_FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="pt-page" style={{ position: "relative", zIndex: 1 }}>
      <GalaxyBackground />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(financialProductSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <PriceTickerDashboard initialSnapshot={snapshot} />
      <PriceTickerFaq />

      <section className="pt-seo-content">
        <div className="pt-seo-inner">

          <p className="pt-last-update">آخرین به‌روزرسانی محتوای این صفحه: {updatedAtFa}</p>
        </div>
      </section>

      <style>{`
        .pt-page { background: #14532d; }
        .pt-seo-content { background: #ffffff; padding: 48px 16px; }
        .pt-seo-inner { max-width: 860px; margin: 0 auto; line-height: 2.1; color: #1f2937; }
        .pt-seo-inner h2 { font-size: 20px; font-weight: 800; margin: 28px 0 10px; color: #111827; }
        .pt-seo-inner p { font-size: 15px; margin-bottom: 14px; }
        .pt-last-update { font-size: 13px; color: #6b7280; margin-top: 24px; }
      `}</style>
    </div>
  );
}
