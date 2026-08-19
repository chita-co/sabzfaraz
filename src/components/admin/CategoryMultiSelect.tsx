"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

interface CategoryLite { id: string; name: string; }

export default function CategoryMultiSelect({
  categories, excludeId, selectedIds, onChange,
}: {
  categories: CategoryLite[];
  excludeId: string; // دسته‌بندی اصلی که در این لیست دوباره نمایش داده نمی‌شود
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [pickerValue, setPickerValue] = useState("");
  const available = categories.filter((c) => c.id !== excludeId && !selectedIds.includes(c.id));

  function addCategory() {
    if (!pickerValue) return;
    onChange([...selectedIds, pickerValue]);
    setPickerValue("");
  }
  function removeCategory(id: string) {
    onChange(selectedIds.filter((c) => c !== id));
  }

  return (
    <div className="admin-form-group">
      <label>دسته‌بندی‌های اضافی (این محصول در این دسته‌ها هم نمایش داده شود — اختیاری)</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedIds.map((id) => {
          const cat = categories.find((c) => c.id === id);
          if (!cat) return null;
          return (
            <span key={id} className="flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1 text-xs">
              {cat.name}
              <button type="button" onClick={() => removeCategory(id)}><X size={12} /></button>
            </span>
          );
        })}
        {selectedIds.length === 0 && <p className="text-xs text-gray-400">دسته‌ی اضافی انتخاب نشده.</p>}
      </div>
      <div className="flex gap-2">
        <select value={pickerValue} onChange={(e) => setPickerValue(e.target.value)} className="admin-input flex-1">
          <option value="">انتخاب دسته‌بندی برای افزودن...</option>
          {available.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button type="button" onClick={addCategory} className="admin-btn admin-btn-secondary"><Plus size={14} /></button>
      </div>
    </div>
  );
}