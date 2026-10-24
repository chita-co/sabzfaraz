// src/components/partner/PartnerProductsView.tsx
"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { X as XIcon, Shapes } from "lucide-react";
import PartnerProductsTable from "@/components/partner/PartnerProductsTable";
import RecategorizeTable, { type RTCategory, type RTProduct } from "@/components/shared/RecategorizeTable";
import { suggestPartnerCategoriesAction, applyPartnerRecategorizeAction } from "@/app/partner/products/recategorize-actions";

type ProductRowProps = React.ComponentProps<typeof PartnerProductsTable>["products"][number];
type ViewProduct = ProductRowProps & { category_id: string | null };

export default function PartnerProductsView({
  products,
  categories,
  actions,
}: {
  products: ViewProduct[];
  categories: RTCategory[];
  actions: React.ReactNode; // دکمه‌های فعلی هدر (افزودن محصول و ...) بدون هیچ تغییری
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [recatList, setRecatList] = useState<RTProduct[] | null>(null);

  const count = selectedIds.size;

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }
  function toggleAll(ids: string[]) {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      const all = ids.length > 0 && ids.every((id) => n.has(id));
      ids.forEach((id) => (all ? n.delete(id) : n.add(id)));
      return n;
    });
  }

  const selectedProducts = useMemo<RTProduct[]>(
    () => products.filter((p) => selectedIds.has(p.id)).map((p) => ({ id: p.id, name: p.name, image: p.images?.[0] ?? null, category_id: p.category_id })),
    [products, selectedIds]
  );

  function startRecategorize() {
    if (count === 0) return toast.error("ابتدا چند محصول را تیک بزنید.");
    setRecatList(selectedProducts);
  }
  function closeRecategorize() {
    setRecatList(null);
    setSelectedIds(new Set());
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <h1 style={{ fontSize: 20, fontWeight: 800 }}>محصولات من</h1>
          {recatList ? (
            <button
              type="button"
              onClick={closeRecategorize}
              title="بازگشت به حالت اولیه"
              style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 14px", fontSize: 13, fontWeight: 700, borderRadius: 10, border: "1px solid #dc2626", background: "#fff", color: "#dc2626", cursor: "pointer" }}
            >
              <XIcon size={15} /> بستن
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecategorize}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", fontSize: 13, fontWeight: 700, borderRadius: 10, border: "1px solid #16a34a", background: "#16a34a", color: "#fff", cursor: "pointer", opacity: count === 0 ? 0.6 : 1 }}
            >
              <Shapes size={15} /> تغییر دسته‌بندی ({count.toLocaleString("fa-IR")})
            </button>
          )}
        </div>
        {!recatList && <div style={{ display: "flex", gap: 8 }}>{actions}</div>}
      </div>

      {recatList ? (
        <RecategorizeTable
          autoSuggest
          products={recatList}
          categories={categories}
          suggest={suggestPartnerCategoriesAction}
          apply={(s, level) => applyPartnerRecategorizeAction({ productId: s.productId, level, levels: s.levels })}
          newCategoryHint="اگر دسته‌ی مناسبی در فهرست نباشد، هوش مصنوعی «دسته‌ی جدید» پیشنهاد می‌دهد و با تایید شما ساخته می‌شود و محصول داخلش قرار می‌گیرد."
          applyLabelNew="تایید و ساخت دسته"
        />
      ) : (
        <PartnerProductsTable products={products} selectedIds={selectedIds} onToggleSelect={toggleSelect} onToggleAll={toggleAll} />
      )}
    </div>
  );
}