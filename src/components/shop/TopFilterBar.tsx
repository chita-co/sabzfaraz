"use client";

import { SlidersHorizontal } from "lucide-react";
import ProductSortSelect from "./ProductSortSelect";

export default function TopFilterBar() {
  return (
    <div className="top-filter-bar">
      <div className="top-filter-bar-inner">
        <span className="top-filter-label">
          <SlidersHorizontal size={15} />
          مرتب‌سازی و مشاهده‌ی همه محصولات
        </span>
        <ProductSortSelect basePath="/products" />
      </div>
    </div>
  );
}