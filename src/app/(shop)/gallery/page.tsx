import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import GalaxyBackground from "@/components/backgrounds/GalaxyBackground";
import GalleryVideoGrid from "@/components/shop/GalleryVideoGrid";
import PageImageBlock from "@/components/shop/PageImageBlock";
import { groupRowImages, normalizePageImages } from "@/lib/pageImages";
import { buildEmbedUrl, buildThumbnailUrl } from "@/lib/unboxing/videoHelpers";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://sabzfaraz.ir").replace(/\/$/, "");
const PAGE_TITLE = "گالری ویدیوهای سبزفراز | آنباکس، معرفی و آموزش قطعات الکترونیک";
const PAGE_DESCRIPTION =
  "گالری ویدیوهای فروشگاه سبزفراز در اینستاگرام، یوتیوب و آپارات: آنباکس، معرفی و تست قطعات و ماژول‌های الکترونیکی و محتوای آموزشی. ویدیوها را همین‌جا تماشا کنید.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/gallery" },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: "/gallery",
    type: "website",
    locale: "fa_IR",
    siteName: "سبزفراز",
  },
  robots: { index: true, follow: true },
};

type GalleryRow = {
  id: string;
  platform: "instagram" | "youtube" | "aparat";
  video_url: string;
  video_id: string | null;
  caption: string | null;
  cover_image_url: string | null;
  created_at: string | null;
};

export default async function GalleryPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("gallery_videos")
    .select("id, platform, video_url, video_id, caption, cover_image_url, created_at")
    .order("platform", { ascending: true })
    .order("created_at", { ascending: false });
  const list = (data ?? []) as GalleryRow[];

  // کوئری جدا: اگر ستون تصاویر هنوز ساخته نشده باشد، خود گالری سالم می‌ماند
  const { data: imgRow } = await supabase.from("site_settings").select("gallery_images").eq("id", 1).single();
  const images = normalizePageImages(imgRow?.gallery_images, "gallery");
  const at = (pos: string) => groupRowImages(images.filter((i) => i.position === pos));

  const byPlatform = (p: GalleryRow["platform"]) => list.filter((v) => v.platform === p);

  // داده‌ی ساختاریافته برای گوگل (اینستاگرام تصویر/embed قابل‌اتکا ندارد و در VideoObject نمی‌آید)
  const videoItems = list
    .filter((v) => (v.platform === "youtube" || v.platform === "aparat") && v.video_id)
    .slice(0, 30)
    .map((v) => ({
      "@type": "VideoObject",
      name: v.caption || "ویدیوی گالری سبزفراز",
      description: v.caption || "ویدیوی گالری فروشگاه سبزفراز",
      thumbnailUrl: [v.cover_image_url || buildThumbnailUrl(v.platform as "youtube" | "aparat", v.video_id as string)],
      uploadDate: v.created_at ?? undefined,
      embedUrl: buildEmbedUrl(v.platform as "youtube" | "aparat", v.video_id as string),
    }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "گالری ویدیوهای سبزفراز",
        description: PAGE_DESCRIPTION,
        url: `${SITE_URL}/gallery`,
        inLanguage: "fa-IR",
        isPartOf: { "@type": "WebSite", name: "سبزفراز", url: SITE_URL },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "خانه", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "گالری", item: `${SITE_URL}/gallery` },
        ],
      },
      ...videoItems,
    ],
  };
  // جلوگیری از بسته‌شدن زودهنگام تگ script با کاراکتر "<" داخل متن‌ها
  const jsonLdString = JSON.stringify(jsonLd).replace(/</g, "\\u003c");

  return (
    <>
      <GalaxyBackground />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString }} />

      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="unboxing-hero">
          <h1>🎬 گالری ویدیوهای سبزفراز</h1>
          <p>
            آنباکس، معرفی و تست قطعات و ماژول‌های الکترونیکی، به‌همراه ویدیوهای آموزشی و تجربه‌ی مشتریان —
            همه‌ی ویدیوهای ما در اینستاگرام، یوتیوب و آپارات را همین‌جا یک‌جا ببینید.
          </p>
        </div>

        {at("after_hero").map((img) => (
          <PageImageBlock key={img.id} image={img} />
        ))}

        {list.length === 0 ? (
          <div className="unboxing-rules-box">
            <p>هنوز ویدیویی در گالری ثبت نشده است. به‌زودی ویدیوهای جدید اضافه می‌شود.</p>
          </div>
        ) : (
          <>
            <GalleryVideoGrid videos={byPlatform("instagram")} />
            {at("after_instagram").map((img) => (
              <PageImageBlock key={img.id} image={img} />
            ))}
            <GalleryVideoGrid videos={byPlatform("youtube")} />
            {at("after_youtube").map((img) => (
              <PageImageBlock key={img.id} image={img} />
            ))}
            <GalleryVideoGrid videos={byPlatform("aparat")} />
          </>
        )}

        {at("end").map((img) => (
          <PageImageBlock key={img.id} image={img} />
        ))}

        <section className="unboxing-rules-box" style={{ marginTop: 36 }}>
          <h2 className="section-title">درباره‌ی گالری ویدیوهای سبزفراز</h2>
          <p>
            در این صفحه ویدیوهایی را می‌بینید که فروشگاه سبزفراز در شبکه‌های اینستاگرام، یوتیوب و آپارات منتشر کرده است:
            از بازکردن بسته و بررسی ظاهر و کیفیت قطعات و ماژول‌های الکترونیکی تا معرفی کاربرد آن‌ها در پروژه‌های آموزشی،
            هابی و صنعتی. هر ویدیو با یک کلیک در همین صفحه پخش می‌شود و نیازی به ترک سایت نیست.
          </p>
          <p style={{ marginTop: 12 }}>
            برای دیدن تجربه‌ی واقعی مشتریان، به صفحه‌ی <Link href="/unboxing">آنباکس مشتریان</Link> سر بزنید و اگر
            دنبال قطعه‌ای خاص هستید، <Link href="/products">محصولات فروشگاه</Link> یا مقالات آموزشی{" "}
            <Link href="/blog">بلاگ سبزفراز</Link> را ببینید.
          </p>
        </section>
      </div>
    </>
  );
}