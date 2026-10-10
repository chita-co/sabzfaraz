import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import Breadcrumb from "@/components/shop/Breadcrumb";
import CompareForm from "@/components/shop/CompareForm";
import CompareTable, { type TableProduct } from "@/components/shop/CompareTable";
import {
  buildCompareProduct,
  buildComparison,
  discountPercent,
  finalPrice,
  findCheapest,
  formatPrice,
  type CompareProduct,
} from "@/lib/compare/parse";
import "./compare.css";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://sabzfaraz.ir";

// فقط محصولات فعال و (اگر همکار است) تأییدشده
const VISIBLE = "partner_id.is.null,partner_approval_status.eq.APPROVED";
const SAFE_SLUG = /^[\p{L}\p{N}_\-.]{1,200}$/u;

type Params = { p?: string | string[] };

function parseSlugs(sp: Params): string[] {
  const raw = Array.isArray(sp.p) ? sp.p : sp.p ? [sp.p] : [];
  // حداکثر ۴ محصول، بدون تکرار، فقط slug های معتبر
  return [...new Set(raw.map((s) => s.trim()).filter((s) => SAFE_SLUG.test(s)))].slice(0, 4);
}

function compareHref(slugs: string[]) {
  return slugs.length > 0 ? `/compare?${slugs.map((s) => `p=${encodeURIComponent(s)}`).join("&")}` : "/compare";
}

const LANDING_TITLE = "مقایسه محصولات الکترونیک؛ ویژگی، مشخصات فنی و قیمت | سبزفراز";
const LANDING_DESC =
  "ابزار مقایسه‌ی محصولات سبزفراز: نام ۲ تا ۴ محصول را وارد کنید و قیمت، ویژگی‌ها، مشخصات فنی و کاربردهایشان را کنار هم ببینید؛ با نمایش جداگانه‌ی تفاوت‌ها و شباهت‌ها.";

export async function generateMetadata({ searchParams }: { searchParams: Promise<Params> }): Promise<Metadata> {
  const hasParams = parseSlugs(await searchParams).length > 0;
  if (hasParams) {
    // هر ترکیب مقایسه، صفحه‌ی تکراری/کم‌محتوا برای گوگل است؛ ایندکس نمی‌شود ولی لینک‌هایش دنبال می‌شوند
    return { title: "مقایسه محصولات | سبزفراز", alternates: { canonical: "/compare" }, robots: { index: false, follow: true } };
  }
  return {
    title: LANDING_TITLE,
    description: LANDING_DESC,
    alternates: { canonical: "/compare" },
    openGraph: { title: LANDING_TITLE, description: LANDING_DESC, type: "website", locale: "fa_IR", url: "/compare" },
  };
}

const FAQ = [
  { q: "چند محصول را می‌توانم هم‌زمان مقایسه کنم؟", a: "از ۲ تا ۴ محصول. نام هر محصول را در یکی از چهار کادر بنویسید و از لیست پیشنهادی انتخاب کنید." },
  { q: "اطلاعات جدول مقایسه از کجا می‌آید؟", a: "مستقیماً از قیمت، ویژگی‌ها، مشخصات فنی و کاربردهایی که روی صفحه‌ی خود هر محصول ثبت شده است؛ بدون حدس و تخمین." },
  { q: "چطور فقط تفاوت‌ها یا فقط شباهت‌ها را ببینم؟", a: "بالای جدول سه دکمه هست: «همه ویژگی‌ها»، «فقط تفاوت‌ها» و «فقط شباهت‌ها». یک نوار هم درصد شباهت محصولات را نشان می‌دهد." },
  { q: "می‌توانم نتیجه‌ی مقایسه را برای دیگران بفرستم؟", a: "بله؛ با دکمه‌ی «کپی لینک مقایسه» آدرس همین مقایسه کپی می‌شود و هر کسی با باز کردنش همان جدول را می‌بیند." },
];

function Landing() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebPage", name: LANDING_TITLE, description: LANDING_DESC, url: `${BASE_URL}/compare`, inLanguage: "fa-IR" },
      {
        "@type": "FAQPage",
        mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
    ],
  };
  const card: React.CSSProperties = { background: "#fff", borderRadius: 14, padding: 18, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", color: "#111827" };

  return (
    <section style={{ marginTop: 20 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <h2 style={{ fontSize: 17, fontWeight: 800, color: "#fff", margin: "0 0 12px" }}>مقایسه چطور کار می‌کند؟</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { n: "۱", t: "نام محصولات را بنویسید", d: "۲ تا ۴ محصول را جست‌وجو و از لیست پیشنهادی انتخاب کنید." },
          { n: "۲", t: "روی «مقایسه» بزنید", d: "جدول مقایسه همان لحظه و بر اساس اطلاعات ثبت‌شده‌ی هر محصول ساخته می‌شود." },
          { n: "۳", t: "تفاوت‌ها را ببینید", d: "قیمت، مشخصات فنی، ویژگی‌ها و کاربردها کنار هم؛ با نمایش جداگانه‌ی تفاوت‌ها و شباهت‌ها." },
        ].map((s) => (
          <div key={s.n} style={card}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#16a34a,#fbbf24)", color: "#fff", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>{s.n}</div>
            <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>{s.t}</h3>
            <p style={{ fontSize: 12.5, color: "#4b5563", lineHeight: 1.9 }}>{s.d}</p>
          </div>
        ))}
      </div>

      <div style={{ ...card, marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>چه چیزهایی مقایسه می‌شود؟</h2>
        <ul style={{ margin: 0, paddingRight: 18, listStyle: "disc", fontSize: 13, color: "#374151", lineHeight: 2.1 }}>
          <li>قیمت (با تخفیف) و وضعیت موجودی هر محصول، و مشخص‌شدن ارزان‌ترین گزینه</li>
          <li>ویژگی‌های اصلی و مشخصات فنی، ردیف‌به‌ردیف و کنار هم</li>
          <li>کاربردهای هر محصول در پروژه‌های الکترونیک و آردوینو</li>
          <li>درصد شباهت و نمایش جداگانه‌ی تفاوت‌ها و شباهت‌ها</li>
        </ul>
      </div>

      <div style={card}>
        <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 10 }}>سوالات متداول درباره‌ی مقایسه‌ی محصولات</h2>
        {FAQ.map((f) => (
          <details key={f.q} style={{ borderTop: "1px solid #eef2f0", padding: "10px 0" }}>
            <summary style={{ cursor: "pointer", fontSize: 13.5, fontWeight: 700 }}>{f.q}</summary>
            <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 2, marginTop: 6 }}>{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export default async function ComparePage({ searchParams }: { searchParams: Promise<Params> }) {
  const slugs = parseSlugs(await searchParams);

  let products: CompareProduct[] = [];
  if (slugs.length > 0) {
    const admin = createAdminClient(); // فقط سمت سرور؛ هیچ‌وقت به مرورگر نمی‌رسد
    const { data: rows } = await admin
      .from("products")
      .select("id, name, slug, images, description, brand, price, discount_price, stock, is_sold_by_unit, unit_label")
      .in("slug", slugs)
      .eq("is_active", true)
      .or(VISIBLE);

    const found = rows ?? [];
    const ids = found.map((r) => r.id as string);
    const { data: attrRows } = ids.length
      ? await admin
          .from("product_attributes")
          .select("product_id, attr_key, attr_value, sort_order")
          .in("product_id", ids)
          .order("sort_order", { ascending: true })
      : { data: [] as { product_id: string; attr_key: string; attr_value: string }[] };

    products = slugs
      .map((slug) => found.find((r) => r.slug === slug))
      .filter((r): r is NonNullable<typeof r> => !!r)
      .map((r) =>
        buildCompareProduct(
          {
            id: r.id as string,
            name: r.name as string,
            slug: r.slug as string,
            image: Array.isArray(r.images) && r.images.length > 0 ? (r.images[0] as string) : null,
            description: (r.description as string | null) ?? null,
            brand: (r.brand as string | null) ?? null,
            price: Number(r.price) || 0,
            discount_price: r.discount_price !== null && r.discount_price !== undefined ? Number(r.discount_price) : null,
            stock: r.stock !== null && r.stock !== undefined ? Number(r.stock) : null,
            is_sold_by_unit: (r.is_sold_by_unit as boolean | null) ?? null,
            unit_label: (r.unit_label as string | null) ?? null,
          },
          (attrRows ?? []).filter((a) => a.product_id === r.id)
        )
      );
  }

  const missing = slugs.length - products.length;
  const model = products.length >= 2 ? buildComparison(products) : null;
  const cheapest = findCheapest(products);

  const tableProducts: TableProduct[] = products.map((p) => ({
    slug: p.slug,
    name: p.name,
    image: p.image,
    inStock: p.inStock,
    cheapest: p.slug === cheapest,
    finalLabel: formatPrice(finalPrice(p)),
    oldLabel: p.discountPrice ? formatPrice(p.price) : null,
    discountPercent: discountPercent(p),
    unit: p.unit,
    removeHref: compareHref(products.filter((x) => x.slug !== p.slug).map((x) => x.slug)),
  }));

  return (
    <div className="mx-auto max-w-6xl px-2 py-4 sm:px-4 sm:py-8">
      <Breadcrumb theme="light" items={[{ label: "مقایسه محصولات" }]} />

      <header className="cmp-hero" style={{ background: "linear-gradient(135deg,#14532d,#166534 60%,#854d0e)", borderRadius: 16, padding: "22px 20px", color: "#fff", marginBottom: 16, border: "1px solid rgba(255,215,0,0.25)" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>مقایسه محصولات</h1>
        <p style={{ fontSize: 13, lineHeight: 2, opacity: 0.92 }}>
          قیمت، ویژگی‌ها، مشخصات فنی و کاربردهای ۲ تا ۴ محصول را کنار هم ببینید و تفاوت‌ها و شباهت‌ها را جداگانه مرور کنید.
        </p>
      </header>

      <div className="cmp-card" style={{ background: "#fff", borderRadius: 16, padding: 20, color: "#111827", boxShadow: "0 4px 24px rgba(0,0,0,0.12)" }}>
        <CompareForm initial={products.map((p) => ({ slug: p.slug, name: p.name, image: p.image }))} />

        {missing > 0 && (
          <p style={{ color: "#b45309", fontSize: 13, marginBottom: 12 }}>{missing} محصول پیدا نشد یا دیگر در دسترس نیست.</p>
        )}
        {slugs.length > 0 && products.length === 1 && (
          <p style={{ color: "#4b5563", fontSize: 13 }}>برای مقایسه، یک محصول دیگر هم اضافه کنید.</p>
        )}

        {model && (
          <CompareTable products={tableProducts} groups={model.groups} same={model.same} diff={model.diff} />
        )}
      </div>

      {slugs.length === 0 && <Landing />}
    </div>
  );
}