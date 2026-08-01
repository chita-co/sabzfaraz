"use client";

import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { bulkUpdateProducts } from "@/app/admin/products/bulk-actions";
import { Category } from "@/types";

export default function BulkEditModal({
  productIds, categories, onClose, onDone,
}: { productIds: string[]; categories: Category[]; onClose: () => void; onDone: () => void }) {
  const [enablePrice, setEnablePrice] = useState(false);
  const [price, setPrice] = useState("");
  const [enableDiscount, setEnableDiscount] = useState(false);
  const [discountPrice, setDiscountPrice] = useState("");
  const [enableBrand, setEnableBrand] = useState(false);
  const [brand, setBrand] = useState("");
  const [enableCategory, setEnableCategory] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [enableActive, setEnableActive] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [enableWeight, setEnableWeight] = useState(false);
  const [weightGrams, setWeightGrams] = useState("");
  const [enableTiers, setEnableTiers] = useState(false);
  const [tiers, setTiers] = useState<{ id: string; minQty: string; maxQty: string; unitPrice: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addTier() { setTiers((prev) => [...prev, { id: crypto.randomUUID(), minQty: "", maxQty: "", unitPrice: "" }]); }
  function updateTier(id: string, field: "minQty" | "maxQty" | "unitPrice", value: string) {
    setTiers((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  }
  function removeTier(id: string) { setTiers((prev) => prev.filter((t) => t.id !== id)); }

  async function handleSubmit() {
    setError(null);
    const changes: Record<string, unknown> = {};
    if (enablePrice) { if (!price) { setError("قیمت را وارد کنید."); return; } changes.price = Number(price); }
    if (enableDiscount) changes.discountPrice = discountPrice ? Number(discountPrice) : null;
    if (enableBrand) changes.brand = brand || null;
    if (enableCategory) { if (!categoryId) { setError("دسته‌بندی را انتخاب کنید."); return; } changes.categoryId = categoryId; }
    if (enableActive) changes.isActive = isActive;
    if (enableWeight) changes.weightGrams = weightGrams ? Number(weightGrams) : null;

    const quantityTiers = enableTiers
      ? tiers.filter((t) => t.minQty && t.maxQty && t.unitPrice).map((t) => ({ minQty: Number(t.minQty), maxQty: Number(t.maxQty), unitPrice: Number(t.unitPrice) }))
      : undefined;

    if (Object.keys(changes).length === 0 && !enableTiers) { setError("حداقل یک فیلد را فعال کنید."); return; }

    setSaving(true);
    const result = await bulkUpdateProducts(productIds, changes, quantityTiers);
    setSaving(false);
    if (result?.error) setError(result.error);
    else onDone();
  }

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">ویرایش گروهی ({productIds.length.toLocaleString("fa-IR")} محصول)</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <div className="space-y-4">
          <FieldRow label="قیمت پایه (تومان)" enabled={enablePrice} onToggle={setEnablePrice}>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="admin-input w-full" disabled={!enablePrice} />
          </FieldRow>
          <FieldRow label="قیمت بعد از تخفیف (خالی = حذف تخفیف)" enabled={enableDiscount} onToggle={setEnableDiscount}>
            <input type="number" value={discountPrice} onChange={(e) => setDiscountPrice(e.target.value)} className="admin-input w-full" disabled={!enableDiscount} />
          </FieldRow>
          <FieldRow label="برند" enabled={enableBrand} onToggle={setEnableBrand}>
            <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} className="admin-input w-full" disabled={!enableBrand} />
          </FieldRow>
          <FieldRow label="دسته‌بندی" enabled={enableCategory} onToggle={setEnableCategory}>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="admin-input w-full" disabled={!enableCategory}>
              <option value="">انتخاب کنید</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </FieldRow>
          <FieldRow label="وضعیت نمایش در فروشگاه" enabled={enableActive} onToggle={setEnableActive}>
            <select value={isActive ? "1" : "0"} onChange={(e) => setIsActive(e.target.value === "1")} className="admin-input w-full" disabled={!enableActive}>
              <option value="1">فعال</option>
              <option value="0">غیرفعال</option>
            </select>
          </FieldRow>
          <FieldRow label="وزن (گرم)" enabled={enableWeight} onToggle={setEnableWeight}>
            <input type="number" value={weightGrams} onChange={(e) => setWeightGrams(e.target.value)} className="admin-input w-full" disabled={!enableWeight} />
          </FieldRow>
          <FieldRow label="تخفیف پلکانی بر اساس تعداد (جایگزین بازه‌های فعلی همه محصولات انتخابی می‌شود)" enabled={enableTiers} onToggle={setEnableTiers}>
            <div className="space-y-2">
              {tiers.map((t) => (
                <div key={t.id} className="grid grid-cols-4 gap-2">
                  <input type="number" placeholder="از" value={t.minQty} onChange={(e) => updateTier(t.id, "minQty", e.target.value)} className="admin-input" disabled={!enableTiers} />
                  <input type="number" placeholder="تا" value={t.maxQty} onChange={(e) => updateTier(t.id, "maxQty", e.target.value)} className="admin-input" disabled={!enableTiers} />
                  <input type="number" placeholder="قیمت واحد" value={t.unitPrice} onChange={(e) => updateTier(t.id, "unitPrice", e.target.value)} className="admin-input" disabled={!enableTiers} />
                  <button type="button" onClick={() => removeTier(t.id)} className="admin-btn admin-btn-danger" disabled={!enableTiers}><Trash2 size={14} /></button>
                </div>
              ))}
              <button type="button" onClick={addTier} className="admin-btn admin-btn-secondary flex items-center gap-1" disabled={!enableTiers}><Plus size={14} /> افزودن بازه</button>
            </div>
          </FieldRow>
        </div>

        {error && <p className="text-red-600 text-sm mt-4">{error}</p>}

        <button onClick={handleSubmit} disabled={saving} className="admin-btn admin-btn-primary w-full mt-5">
          {saving ? "در حال اعمال تغییرات..." : "اعمال روی محصولات انتخاب‌شده"}
        </button>
      </div>
    </div>
  );
}

function FieldRow({ label, enabled, onToggle, children }: { label: string; enabled: boolean; onToggle: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <div className={`bulk-field-row${enabled ? " active" : ""}`}>
      <label className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700">
        <input type="checkbox" checked={enabled} onChange={(e) => onToggle(e.target.checked)} />
        {label}
      </label>
      {children}
    </div>
  );
}