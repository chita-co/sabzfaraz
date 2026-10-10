// src/components/shop/PageImageBlock.tsx
// نمایش یک تصویر (یا یک گروه تصویرِ «کنار هم») در صفحات «درباره ما»، «تماس با ما»، «انباکس» و «گالری» (کامپوننت سروری، بدون hook)
import type { PageImage } from "@/lib/pageImages";

function Img({ image }: { image: PageImage }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={image.url}
      alt={image.alt}
      loading="lazy"
      decoding="async"
      style={{ width: image.width, maxWidth: "100%", height: "auto", borderRadius: 12, display: "block" }}
    />
  );
}

export default function PageImageBlock({ image, inline = false }: { image: PageImage; inline?: boolean }) {
  // گروه تصاویر «کنار هم»
  if (image.group && image.group.length > 0) {
    // کنار باکس (تماس با ما): تصاویر گروه زیر هم می‌آیند
    if (inline) {
      return (
        <div style={{ flex: "0 1 auto", maxWidth: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
          {image.group.map((g) => (
            <Img key={g.id} image={g} />
          ))}
        </div>
      );
    }
    // ردیف تصاویر: ترتیب از راست به چپ (مطابق خواندن فارسی)، با رفتن به خط بعد در صورت نبود جا
    const rowJustify = image.align === "right" ? "flex-start" : image.align === "left" ? "flex-end" : "center";
    return (
      <div
        dir="rtl"
        style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-start", justifyContent: rowJustify, margin: "16px 0" }}
      >
        {image.group.map((g) => (
          <Img key={g.id} image={g} />
        ))}
      </div>
    );
  }

  const img = <Img image={image} />;

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