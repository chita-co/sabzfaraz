"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";

export default function ArticleImageLightbox() {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    const container = document.querySelector(".blog-article-content");
    if (!container) return;
    function handleClick(e: Event) {
      const target = e.target as HTMLElement;
      if (target.tagName === "IMG") setSrc((target as HTMLImageElement).src);
    }
    container.addEventListener("click", handleClick);
    return () => container.removeEventListener("click", handleClick);
  }, []);

  if (!src) return null;
  return (
    <div className="blog-lightbox-overlay" onClick={() => setSrc(null)}>
      <button className="blog-lightbox-close" onClick={() => setSrc(null)}><X size={22} /></button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" onClick={(e) => e.stopPropagation()} />
    </div>
  );
}