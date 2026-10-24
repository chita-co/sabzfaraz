// src/components/shop/MobileSubItem.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import "./MobileSubItem.css";

export interface MobileSubNode {
  id: string;
  name: string;
  slug: string;
  children?: { id: string; name: string; slug: string }[];
}

export default function MobileSubItem({ sub, onNavigate }: { sub: MobileSubNode; onNavigate: () => void }) {
  const [open, setOpen] = useState(false);
  const kids = sub.children ?? [];

  return (
    <div className="m-sub-wrap">
      <div className="m-sub-row">
        <Link href={`/category/${sub.slug}`} className="m-sub-link" onClick={onNavigate}>
          {sub.name}
        </Link>
        {kids.length > 0 && (
          <button
            type="button"
            className={`m-sub-arrow${open ? " open" : ""}`}
            aria-label="نمایش زیردسته‌های نوه"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <ChevronDown size={14} />
          </button>
        )}
      </div>
      {open && kids.length > 0 && (
        <div className="m-grand-list">
          {kids.map((g) => (
            <Link key={g.id} href={`/category/${g.slug}`} className="m-grand-link" onClick={onNavigate}>
              {g.name}
            </Link>
          ))}
          <Link href={`/category/${sub.slug}`} className="m-viewall" onClick={onNavigate}>
            مشاهده همه
          </Link>
        </div>
      )}
    </div>
  );
}