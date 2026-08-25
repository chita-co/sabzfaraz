import { ReactNode } from "react";

export default function ArticleBody({ content, ctaComponent }: { content: string; ctaComponent: ReactNode }) {
  const marker = /<div data-product-cta="[^"]*"><\/div>/;
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