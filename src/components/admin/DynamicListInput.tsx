"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

export default function DynamicListInput({
  name, label, placeholder, initialValues, type = "text",
}: {
  name: string; label: string; placeholder?: string; initialValues: string[]; type?: "text" | "email" | "tel";
}) {
  const [values, setValues] = useState<string[]>(initialValues);

  function addField() { setValues((prev) => [...prev, ""]); }
  function removeField(i: number) { setValues((prev) => prev.filter((_, idx) => idx !== i)); }
  function updateField(i: number, v: string) { setValues((prev) => prev.map((val, idx) => (idx === i ? v : val))); }

  return (
    <div className="admin-form-group">
      <div className="flex items-center justify-between mb-1">
        <label style={{ marginBottom: 0 }}>{label}</label>
        <button type="button" onClick={addField} className="admin-btn admin-btn-secondary" style={{ padding: "3px 8px" }}>
          <Plus size={13} />
        </button>
      </div>
      <div className="space-y-2">
        {values.map((v, i) => (
          <div key={i} className="flex items-center gap-2">
            <input type={type} name={name} value={v} onChange={(e) => updateField(i, e.target.value)} placeholder={placeholder} className="admin-input" dir="ltr" style={{ flex: 1 }} />
            <button type="button" onClick={() => removeField(i)} className="admin-btn admin-btn-danger" style={{ padding: "6px 8px" }}>
              <X size={13} />
            </button>
          </div>
        ))}
        {values.length === 0 && <p className="text-xs text-gray-400">موردی ثبت نشده — برای افزودن روی + بزنید.</p>}
      </div>
    </div>
  );
}