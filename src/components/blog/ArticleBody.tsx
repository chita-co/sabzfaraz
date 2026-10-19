import { ReactNode } from "react";
import { ensureImageAlt } from "@/lib/blog/ensureImageAlt";

export default function ArticleBody({ content, ctaComponent, imageAlt = "تصویر مقاله" }: { content: string; ctaComponent: ReactNode; imageAlt?: string }) {
  const marker = /<div data-product-cta="[^"]*"><\/div>/;
  content = ensureImageAlt(content, imageAlt);
  const parts = content.split(marker);

  if (parts.length === 1) {
    return <div className="blog-article-content" dangerouslySetInnerHTML={{ __html: content }} />;
  }
  return (
    <div className="blog-article-content">
      <div dangerouslySetInnerHTML={{ __html: parts[0] }} />
      {ctaComponent}
      <div dangerouslySetInnerHTML={{ __html: parts.slice(1).join("") }} />
    </div>
  );
}