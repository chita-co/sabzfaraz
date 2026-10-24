// src/components/shop/SubcatCards.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, LayoutGrid } from "lucide-react";
import "./SubcatCards.css";

export interface SubcatItem {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  children: { name: string; slug: string }[];
}

export default function SubcatCards({
  items,
  basePath,
  title = "دسته‌های فرعی",
}: {
  items: SubcatItem[];
  basePath: string;
  title?: string;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  return (
    <section className="subcat-glass" aria-label={title}>
      <div className="subcat-glass-title">{title}</div>
      <div className="subcat-grid">
        {items.map((sc) => {
          const hasKids = sc.children.length > 0;
          const isOpen = !!open[sc.id];
          return (
            <div key={sc.id} className="subcat-wrap">
              <div className="subcat-row">
                <Link href={`${basePath}?sub=${sc.slug}`} className="subcat-card">
                  <span className="subcat-img">
                    {sc.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={sc.image} alt={sc.name} loading="lazy" />
                    ) : (
                      <LayoutGrid size={28} />
                    )}
                  </span>
                  <span className="subcat-name">{sc.name}</span>
                </Link>
                {hasKids && (
                  <button
                    type="button"
                    className="subcat-arrow"
                    aria-label="نمایش زیردسته‌های نوه"
                    aria-expanded={isOpen}
                    onClick={() => setOpen((p) => ({ ...p, [sc.id]: !p[sc.id] }))}
                  >
                    <ChevronDown
                      size={14}
                      style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }}
                    />
                  </button>
                )}
              </div>
              {hasKids && isOpen && (
                <div className="subcat-kids">
                  {sc.children.map((g) => (
                    <Link key={g.slug} href={`${basePath}?sub=${g.slug}`}>
                      {g.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}