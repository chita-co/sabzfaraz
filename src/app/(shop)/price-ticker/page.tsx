// src/app/(shop)/قیمت-لحظه-ای-طلا-دلار/page.tsx
//
// این صفحه داخل گروه (shop) قرار دارد پس به‌صورت خودکار Header و Footer سایت
// (src/app/(shop)/layout.tsx) را می‌گیرد — هیچ فایل دیگری لازم نیست دست بخورد.

import type { Metadata } from "next";
import { getPriceSnapshot } from "@/lib/priceTicker/cache";
import PriceTickerDashboard from "@/components/price-ticker/PriceTickerDashboard";
import PriceTickerFaq, { PRICE_TICKER_FAQS } from "@/components/price-ticker/PriceTickerFaq";


export const dynamic = 'force-dynamic';


// هر ۳۰ ثانیه HTML صفحه در پس‌زمینه تازه می‌شود (ISR) — سریع برای کاربر و
// سئو، و سبک برای پلن رایگان Vercel (نه یک تابع سرورلس در هر بازدید).
export const revalidate = 30;

const description =
  "مشاهده قیمت لحظه‌ای دلار، یورو، سکه امامی، طلای ۱۸ عیار و برترین ارزهای دیجیتال (با منبع CoinGecko) به‌همراه نمودار تغییرات، ماشین‌حساب طلا و سکه، هشدار قیمت و اشتراک‌گذاری آسان. به‌روزرسانی هر ۳۰ ثانیه.";

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
    <div className="pt-page">
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

      <section className="pt-seo-content">
        <div className="pt-seo-inner">
          <h2>قیمت دلار، طلا و ارز دیجیتال چطور تعیین می‌شود؟</h2>
          <p>
            قیمتی که در این صفحه می‌بینید، برآیند لحظه‌ای معاملات بازار آزاد ارز و طلا در
            ایران و بازارهای جهانی ارز دیجیتال است. قیمت دلار در بازار آزاد تحت تأثیر عرضه
            و تقاضای صرافی‌های خیابانی، حجم واردات و صادرات، سیاست‌های ارزی بانک مرکزی،
            انتظارات تورمی و اخبار سیاسی و اقتصادی روز شکل می‌گیرد. به همین دلیل ممکن است
            نرخ نمایش داده شده در سایت‌های مختلف با چند صد تا چند هزار تومان اختلاف داشته
            باشد؛ این اختلاف طبیعی است و معمولاً به لحظه‌ی دقیق ثبت قیمت و منبع داده هر
            سایت برمی‌گردد.
          </p>
          <p>
            قیمت طلا نیز از دو متغیر اصلی تبعیت می‌کند: قیمت جهانی انس طلا (که به دلار
            آمریکا معامله می‌شود) و نرخ برابری دلار به تومان. وقتی هر یک از این دو عدد
            تغییر کند، قیمت هر گرم طلای ۱۸ عیار در ایران هم بلافاصله واکنش نشان می‌دهد. قیمت
            سکه هم علاوه بر این دو عامل، تحت تأثیر عرضه و تقاضای بازار داخلی سکه و انتظارات
            کوتاه‌مدت معامله‌گران است؛ به همین دلیل قیمت سکه معمولاً با ارزش ذاتیِ طلای
            داخل آن (که در همین صفحه به‌عنوان «حباب سکه» محاسبه شده) فاصله دارد.
          </p>

          <h2>تفاوت قیمت خرید و فروش در چیست؟</h2>
          <p>
            هر صراف یا پلتفرم معاملاتی برای پوشش هزینه و ریسک نگهداری، بین قیمتی که ارز یا
            طلا را می‌خرد و قیمتی که می‌فروشد، فاصله‌ای در نظر می‌گیرد که به آن «اسپرد» گفته
            می‌شود. در بازارهای کم‌نوسان این فاصله معمولاً کم و در روزهای پرنوسان بیشتر
            می‌شود. عددی که در این صفحه به‌عنوان قیمت لحظه‌ای نمایش داده می‌شود، میانگین/نرخ
            مرجع بازار آزاد است، نه لزوماً قیمت خرید یا فروش یک صرافی خاص.
          </p>

          <h2>ماشین‌حساب تبدیل ارز و طلا چگونه کار می‌کند؟</h2>
          <p>
            با ابزار تبدیل ارز بالای همین صفحه، کافی‌ست عدد و ارز موردنظرتان را وارد کنید تا
            بلافاصله معادل تومانی آن با آخرین نرخ لحظه‌ای محاسبه شود. برای طلا هم با وارد
            کردن وزن (به گرم)، عیار و اجرت ساخت، قیمت تقریبی طلای موردنظرتان به‌صورت آنی
            نمایش داده می‌شود. توجه داشته باشید که این ابزار برای برآورد سریع طراحی شده و
            قیمت نهایی طلاجات ممکن است بسته به طراحی، اجرت دقیق طلافروش و مالیات با عدد
            محاسبه‌شده کمی تفاوت داشته باشد.
          </p>

          <h2>چرا این صفحه به عنوان یک ابزار رایگان ارائه شده؟</h2>
          <p>
            سبزفراز فروشگاه تخصصی قطعات و تجهیزات الکترونیک است و قیمت بسیاری از محصولات آن
            (به‌ویژه قطعات وارداتی) مستقیماً به نرخ دلار وابسته است. به همین دلیل، ارائه‌ی
            یک مرجع رایگان و به‌روز از نرخ ارز و طلا، هم به کاربران در تصمیم‌گیری خرید کمک
            می‌کند و هم شفافیت قیمت‌گذاری محصولات سایت را افزایش می‌دهد. این صفحه به‌طور
            کامل رایگان است و نیازی به ثبت‌نام یا ورود ندارد.
          </p>

          <h2>منبع قیمت ارزهای دیجیتال</h2>
          <p>
            برخلاف بسیاری از سایت‌های مشابه، قیمت ارزهای دیجیتال این صفحه از CoinGecko گرفته
            می‌شود؛ یکی از شناخته‌شده‌ترین و معتبرترین منابع قیمت رمزارز در سطح جهانی که
            میانگین قیمت را از ده‌ها صرافی بین‌المللی محاسبه می‌کند. این یعنی قیمت دلاری
            بیت‌کوین، اتریوم و بقیه‌ی ارزهای دیجیتال این صفحه، همان عددی است که در معتبرترین
            پلتفرم‌های تحلیل بازار رمزارز هم می‌بینید؛ معادل تومانی آن هم بر اساس آخرین نرخ
            لحظه‌ای دلار همین صفحه محاسبه و به‌روزرسانی می‌شود.
          </p>

          <p className="pt-last-update">آخرین به‌روزرسانی محتوای این صفحه: {updatedAtFa}</p>
        </div>
      </section>

      <PriceTickerFaq />

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
