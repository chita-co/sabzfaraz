import { Fragment, Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import AntigravityBackground from "@/components/backgrounds/AntigravityBackground";
import PageImageBlock from "@/components/shop/PageImageBlock";
import { normalizePageImages } from "@/lib/pageImages";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "درباره ما | سبزفراز",
  description: "آشنایی با فروشگاه اینترنتی سبزفراز — فروشگاه تخصصی قطعات الکترونیک، ماژول، سنسور و تجهیزات با ارسال سریع به سراسر کشور.",
  alternates: { canonical: "/about" },
};

async function AboutContent() {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("site_settings")
    .select("store_name, about_content")
    .eq("id", 1)
    .single();

  // کوئری جدا: اگر ستون تصاویر هنوز ساخته نشده باشد، متن «درباره ما» سالم می‌ماند
  const { data: imgRow } = await supabase
    .from("site_settings")
    .select("about_images")
    .eq("id", 1)
    .single();
  const images = normalizePageImages(imgRow?.about_images, "about");

  const storeName = settings?.store_name ?? "سبزفراز";
  const content = settings?.about_content;

  // پاراگراف‌ها با خط خالی از هم جدا می‌شوند (فقط وقتی تصویر داریم استفاده می‌شود)
  const defaultText = `${storeName} یک فروشگاه اینترنتی تخصصی در زمینه‌ی فروش قطعات، ماژول‌ها و تجهیزات الکترونیکی است. هدف ما فراهم کردن دسترسی آسان، سریع و مطمئن به قطعاتی است که برای پروژه‌های آموزشی، صنعتی و هابی مورد نیاز دارید.`;
  const paragraphs: string[] = content
    ? String(content).split(/\n\s*\n/).map((p: string) => p.trim()).filter(Boolean)
    : [defaultText];
  const atPos = (pos: string) => images.filter((i) => i.position === pos);
  const endImages = images.filter(
    (i) => i.position === "end" || (i.position.startsWith("after_p_") && Number(i.position.slice(8)) > paragraphs.length)
  );

  return (
    <>
      <AntigravityBackground />
      <div className="mx-auto max-w-3xl px-4 py-12 relative z-10">
        <h1 className="text-2xl font-bold mb-6" style={{ color: "#fbbf24" }}>
          درباره {storeName}
        </h1>
        {atPos("after_title").map((img) => (
          <PageImageBlock key={img.id} image={img} />
        ))}
        <div className="leading-8" style={{ color: "#f0f0f0" }}>
          {images.length === 0 ? (
            content ? (
              <p style={{ whiteSpace: "pre-line" }}>{content}</p>
            ) : (
              <p>
                {storeName} یک فروشگاه اینترنتی تخصصی در زمینه‌ی فروش قطعات، ماژول‌ها و
                تجهیزات الکترونیکی است. هدف ما فراهم کردن دسترسی آسان، سریع و مطمئن به
                قطعاتی است که برای پروژه‌های آموزشی، صنعتی و هابی مورد نیاز دارید.
              </p>
            )
          ) : (
            paragraphs.map((p, idx) => (
              <Fragment key={idx}>
                <p style={{ whiteSpace: "pre-line", marginBottom: 16 }}>{p}</p>
                {atPos(`after_p_${idx + 1}`).map((img) => (
                  <PageImageBlock key={img.id} image={img} />
                ))}
              </Fragment>
            ))
          )}
        </div>
        {endImages.map((img) => (
          <PageImageBlock key={img.id} image={img} />
        ))}
      </div>
    </>
  );
}

export default function AboutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">در حال بارگذاری...</div>}>
      <AboutContent />
    </Suspense>
  );
}