"use client";
import { useEffect, useState } from "react";

interface TocItem { id: string; text: string; level: number; }

export default function TableOfContents() {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const container = document.querySelector(".blog-article-content");
    if (!container) return;
    const headings = Array.from(container.querySelectorAll("h2, h3")) as HTMLElement[];
    const tocItems = headings.map((h, i) => {
      const id = h.id || `heading-${i}`;
      h.id = id;
      return { id, text: h.textContent ?? "", level: h.tagName === "H2" ? 2 : 3 };
    });

    const timer = setTimeout(() => setItems(tocItems), 0);

    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => { if (entry.isIntersecting) setActiveId(entry.target.id); }),
      { rootMargin: "-100px 0px -70% 0px" }
    );
    headings.forEach((h) => observer.observe(h));

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  if (items.length < 2) return null;
  return (
    <nav className="blog-toc">
      <span className="blog-toc-title">فهرست مطالب</span>
      {items.map((item) => (
        <a key={item.id} href={`#${item.id}`} className={`blog-toc-link level-${item.level}${activeId === item.id ? " active" : ""}`}>{item.text}</a>
      ))}
    </nav>
  );
}