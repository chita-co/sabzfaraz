// src/components/shop/PageImageBlock.tsx
// نمایش یک تصویر در صفحات «درباره ما» و «تماس با ما» (کامپوننت سروری، بدون hook)
import type { PageImage } from "@/lib/pageImages";

export default function PageImageBlock({ image, inline = false }: { image: PageImage; inline?: boolean }) {
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={image.url}
      alt={image.alt}
      loading="lazy"
      decoding="async"
      style={{ width: image.width, maxWidth: "100%", height: "auto", borderRadius: 12, display: "block" }}
    />
  );

  // تصویر «کنار باکس»
  if (inline) return <div style={{ flex: "0 1 auto", maxWidth: "100%" }}>{img}</div>;

  // تصویر مستقل: چپ / وسط / راست (فیزیکی، مستقل از راست‌به‌چین بودن صفحه)
  const justify = image.align === "left" ? "flex-start" : image.align === "right" ? "flex-end" : "center";
  return (
    <div dir="ltr" style={{ display: "flex", justifyContent: justify, margin: "16px 0" }}>
      {img}
    </div>
  );
}