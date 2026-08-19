"use client";

import { Plus, X } from "lucide-react";

export interface AttributeRow { id: string; key: string; value: string; }

export default function ProductAttributesEditor({
  attributes, onChange,
}: {
  attributes: AttributeRow[];
  onChange: (rows: AttributeRow[]) => void;
}) {
  function addRow() {
    onChange([...attributes, { id: crypto.randomUUID(), key: "", value: "" }]);
  }
  function updateRow(id: string, field: "key" | "value", value: string) {
    onChange(attributes.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }
  function removeRow(id: string) {
    onChange(attributes.filter((r) => r.id !== id));
  }

  return (
    <div className="admin-form-group">
      <label>ویژگی‌های فنی (مثل قطر، ضخامت، ولتاژ — اختیاری)</label>
      <div className="space-y-2 mb-2">
        {attributes.map((row) => (
          <div key={row.id} className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <input type="text" placeholder="ویژگی (مثلاً: ولتاژ)" value={row.key} onChange={(e) => updateRow(row.id, "key", e.target.value)} className="admin-input" />
            <input type="text" placeholder="مقدار (مثلاً: 5 ولت)" value={row.value} onChange={(e) => updateRow(row.id, "value", e.target.value)} className="admin-input" />
            <button type="button" onClick={() => removeRow(row.id)} className="admin-btn admin-btn-danger"><X size={14} /></button>
          </div>
        ))}
      </div>
      <button type="button" onClick={addRow} className="admin-btn admin-btn-secondary flex items-center gap-1">
        <Plus size={14} /> افزودن ویژگی
      </button>
    </div>
  );
}