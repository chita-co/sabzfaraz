// src/components/admin/ProductRecategorizePanel.tsx
"use client";

import { X } from "lucide-react";
import RecategorizeTable, { type RTCategory, type RTProduct } from "@/components/shared/RecategorizeTable";
import { suggestAdminCategoriesAction, applyAdminRecategorizeAction } from "@/app/admin/categories/recategorize-actions";

export default function ProductRecategorizePanel({
  products,
  categories,
  onClose,
}: {
  products: RTProduct[];
  categories: RTCategory[];
  onClose: () => void;
}) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 8, flexWrap: "wrap" }}>
        <h2 style={{ fontSize: 15, fontWeight: 700 }}>
          دسته‌بندی مجدد {products.length.toLocaleString("fa-IR")} محصول انتخاب‌شده
        </h2>
        <button
          type="button"
          onClick={onClose}
          title="بازگشت به حالت اولیه"
          style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 14px", fontSize: 13, fontWeight: 700, borderRadius: 10, border: "1px solid #dc2626", background: "#fff", color: "#dc2626", cursor: "pointer" }}
        >
          <X size={15} /> بستن
        </button>
      </div>

      <RecategorizeTable
        autoSuggest
        products={products}
        categories={categories}
        suggest={suggestAdminCategoriesAction}
        apply={(s, level) => applyAdminRecategorizeAction({ productId: s.productId, level, levels: s.levels })}
        newCategoryHint="اگر هوش مصنوعی دسته‌ی جدید پیشنهاد دهد، با تایید ساخته می‌شود و محصول در آن قرار می‌گیرد."
        applyLabelNew="تایید و ساخت دسته"
      />
    </div>
  );
}