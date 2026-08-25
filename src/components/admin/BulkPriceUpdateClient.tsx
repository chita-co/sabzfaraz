"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, Percent, Hash } from "lucide-react";
import { bulkAdjustProductPrices } from "@/app/admin/products/actions";

interface CategoryLite { id: string; name: string; }

export default function BulkPriceUpdateClient({ categories }: { categories: CategoryLite[] }) {
  const [scope, setScope] = useState<"all" | "categories">("all");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [direction, setDirection] = useState<"increase" | "decrease">("increase");
  const [adjustType, setAdjustType] = useState<"percent" | "fixed">("percent");
  const [amount, setAmount] = useState("10");
  const [applyToDiscount, setApplyToDiscount] = useState(true);
  const [roundingMode, setRoundingMode] = useState<"none" | "up" | "down" | "nearest">("nearest");
  const [roundingStep, setRoundingStep] = useState("1000");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggleCategory(id: string) {
    setSelectedCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  async function handleSubmit() {
    setError(null);
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) { setError("مقدار تغییر قیمت را به‌درستی وارد کنید."); return; }
    if (scope === "categories" && selectedCategoryIds.length === 0) { setError("حداقل یک دسته‌بندی انتخاب کنید."); return; }

    const scopeText = scope === "all" ? "همه محصولات فروشگاه" : `${selectedCategoryIds.length.toLocaleString("fa-IR")} دسته‌بندی انتخابی`;
    const directionText = direction === "increase" ? "افزایش" : "کاهش";
    const amountText = adjustType === "percent" ? `${numAmount.toLocaleString("fa-IR")}٪` : `${numAmount.toLocaleString("fa-IR")} تومان`;
    if (!confirm(`آیا از ${directionText} قیمت ${scopeText} به میزان ${amountText} مطمئن هستید؟ این تغییر بلافاصله و به‌صورت گروهی روی قیمت‌ها اعمال می‌شود.`)) return;

    setRunning(true);
    setResult(null);
    const res = await bulkAdjustProductPrices({
      categoryIds: scope === "all" ? [] : selectedCategoryIds,
      adjustType,
      direction,
      amount: numAmount,
      applyToDiscount,
      roundingStep: roundingMode === "none" ? 0 : Number(roundingStep) || 0,
      roundingMode: roundingMode === "none" ? "nearest" : roundingMode,
    });
    setRunning(false);
    if (res?.error) { setError(res.error); return; }
    setResult(`قیمت ${(res.updatedCount ?? 0).toLocaleString("fa-IR")} محصول با موفقیت به‌روزرسانی شد.`);
  }

  return (
    <div className="admin-card" style={{ maxWidth: 720 }}>
      <h1 className="text-xl font-bold text-gray-900 mb-1">به‌روزرسانی گروهی قیمت‌ها</h1>
      <p className="text-xs text-gray-500 mb-6">قیمت چند محصول را هم‌زمان افزایش یا کاهش دهید — بر اساس درصد یا مبلغ ثابت، برای همه‌ی محصولات یا فقط دسته‌بندی‌های خاص. این ابزار روی دسته‌بندی اصلی محصول عمل می‌کند.</p>

      <div className="admin-form-group">
        <label>دامنه‌ی اعمال تغییر</label>
        <div className="bulk-price-radio-row">
          <label className={`bulk-price-radio${scope === "all" ? " active" : ""}`}>
            <input type="radio" name="scope" checked={scope === "all"} onChange={() => setScope("all")} /> همه محصولات فروشگاه
          </label>
          <label className={`bulk-price-radio${scope === "categories" ? " active" : ""}`}>
            <input type="radio" name="scope" checked={scope === "categories"} onChange={() => setScope("categories")} /> فقط دسته‌بندی‌های انتخابی
          </label>
        </div>
      </div>

      {scope === "categories" && (
        <div className="admin-form-group">
          <label>انتخاب دسته‌بندی‌ها</label>
          <div className="bulk-price-cat-grid">
            {categories.map((c) => (
              <label key={c.id} className="bulk-price-cat-item">
                <input type="checkbox" checked={selectedCategoryIds.includes(c.id)} onChange={() => toggleCategory(c.id)} />
                {c.name}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="admin-form-group">
          <label>جهت تغییر قیمت</label>
          <div className="bulk-price-radio-row">
            <label className={`bulk-price-radio${direction === "increase" ? " active" : ""}`}>
              <input type="radio" name="direction" checked={direction === "increase"} onChange={() => setDirection("increase")} />
              <TrendingUp size={14} /> افزایش
            </label>
            <label className={`bulk-price-radio${direction === "decrease" ? " active" : ""}`}>
              <input type="radio" name="direction" checked={direction === "decrease"} onChange={() => setDirection("decrease")} />
              <TrendingDown size={14} /> کاهش
            </label>
          </div>
        </div>
        <div className="admin-form-group">
          <label>نوع تغییر</label>
          <div className="bulk-price-radio-row">
            <label className={`bulk-price-radio${adjustType === "percent" ? " active" : ""}`}>
              <input type="radio" name="adjustType" checked={adjustType === "percent"} onChange={() => setAdjustType("percent")} />
              <Percent size={14} /> درصدی
            </label>
            <label className={`bulk-price-radio${adjustType === "fixed" ? " active" : ""}`}>
              <input type="radio" name="adjustType" checked={adjustType === "fixed"} onChange={() => setAdjustType("fixed")} />
              <Hash size={14} /> مبلغ ثابت
            </label>
          </div>
        </div>
      </div>

      <div className="admin-form-group">
        <label>{adjustType === "percent" ? "درصد تغییر" : "مبلغ تغییر (تومان)"}</label>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min={0} />
      </div>

      <div className="admin-form-group flex items-center gap-2">
        <input type="checkbox" id="applyToDiscount" checked={applyToDiscount} onChange={(e) => setApplyToDiscount(e.target.checked)} />
        <label htmlFor="applyToDiscount" style={{ marginBottom: 0 }}>این تغییر روی «قیمت بعد از تخفیف» محصولات هم اعمال شود (در صورت وجود)</label>
      </div>

      <div className="admin-form-group">
        <label>گرد کردن قیمت نهایی</label>
        <select value={roundingMode} onChange={(e) => setRoundingMode(e.target.value as typeof roundingMode)}>
          <option value="none">بدون گرد کردن (فقط تا عدد صحیح تومان)</option>
          <option value="nearest">گرد به نزدیک‌ترین مقدار</option>
          <option value="up">گرد به بالا (سقف)</option>
          <option value="down">گرد به پایین (کف)</option>
        </select>
      </div>

      {roundingMode !== "none" && (
        <div className="admin-form-group">
          <label>گام گرد کردن (تومان — مثلاً ۱۰۰۰ یا ۵۰۰۰)</label>
          <input type="number" value={roundingStep} onChange={(e) => setRoundingStep(e.target.value)} min={1} />
        </div>
      )}

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      {result && <p className="text-green-600 text-sm mb-3">{result}</p>}

      <button onClick={handleSubmit} disabled={running} className="admin-btn admin-btn-primary">
        {running ? "در حال اعمال تغییرات..." : "اعمال تغییر قیمت"}
      </button>

      <style jsx>{`
        .bulk-price-radio-row { display: flex; gap: 10px; flex-wrap: wrap; }
        .bulk-price-radio {
          display: flex; align-items: center; gap: 6px;
          border: 1.5px solid #e5e7eb; border-radius: 10px; padding: 9px 14px;
          font-size: 13px; color: #374151; cursor: pointer; transition: 0.15s;
        }
        .bulk-price-radio.active { border-color: #16a34a; background: #f0fdf4; color: #15803d; font-weight: 700; }
        .bulk-price-radio input { accent-color: #16a34a; }
        .bulk-price-cat-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 8px;
          max-height: 220px; overflow-y: auto; border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px;
        }
        .bulk-price-cat-item { display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: #374151; }
      `}</style>
    </div>
  );
}