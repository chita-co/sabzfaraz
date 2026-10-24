// src/components/shared/LevelEditor.tsx
"use client";

import { useMemo, useState } from "react";
import type { RTCategory, RTLevel } from "@/components/shared/RecategorizeTable";

type Lvl = 1 | 2 | 3;
const LABEL: Record<Lvl, string> = { 1: "اصلی", 2: "فرعی", 3: "زیرفرعی" };
const NEW = "__new__";

function norm(s: string) {
  return s.replace(/[يى]/g, "ی").replace(/ك/g, "ک").replace(/\s+/g, " ").trim().toLowerCase();
}
function cleanSlug(s: string) {
  return s.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

const inp: React.CSSProperties = {
  width: "100%",
  fontSize: 12,
  padding: "5px 8px",
  borderRadius: 6,
  border: "1px solid #d1d5db",
  background: "#fff",
};

export default function LevelEditor({
  lvl,
  levels,
  allCats,
  paths,
  onSave,
  onCancel,
}: {
  lvl: Lvl;
  levels: [RTLevel | null, RTLevel | null, RTLevel | null];
  allCats: RTCategory[];
  paths: Map<string, string>;
  onSave: (slot: RTLevel) => void;
  onCancel: () => void;
}) {
  const prev = lvl > 1 ? levels[lvl - 2] : null;
  const blocked = lvl > 1 && !prev;
  const prefixId = prev?.categoryId ?? null;
  const prefixLabel = prev?.label ?? "";

  const options = useMemo(() => {
    const list =
      lvl === 1
        ? allCats.filter((c) => c.parent_id === null)
        : prefixId
        ? allCats.filter((c) => c.parent_id === prefixId)
        : [];
    return [...list].sort((a, b) => a.name.localeCompare(b.name, "fa"));
  }, [allCats, lvl, prefixId]);

  const initial = levels[lvl - 1];
  const [choice, setChoice] = useState<string>(initial?.categoryId ?? (initial?.newName ? NEW : ""));
  const [newName, setNewName] = useState(initial?.newName ?? "");
  const [newSlug, setNewSlug] = useState(initial?.newSlug ?? "");
  const [err, setErr] = useState<string | null>(null);

  function save() {
    if (blocked) return;
    if (choice === NEW) {
      const name = newName.trim();
      if (name.length < 2) return setErr("نام دسته‌ی جدید حداقل ۲ حرف باشد.");
      onSave({
        key: `new:${norm(name)}`,
        categoryId: null,
        newName: name,
        newSlug: cleanSlug(newSlug) || cleanSlug(name),
        label: prefixLabel ? `${prefixLabel} › ${name}` : name,
      });
      return;
    }
    if (!choice) return setErr("یک دسته را انتخاب کنید.");
    onSave({
      key: `cat:${choice}`,
      categoryId: choice,
      newName: null,
      newSlug: null,
      label: paths.get(choice) ?? "",
    });
  }

  return (
    <div style={{ marginTop: 8, padding: 10, border: "1px dashed #9ca3af", borderRadius: 10, background: "#f9fafb" }}>
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>ویرایش دسته‌ی {LABEL[lvl]}</div>

      {blocked ? (
        <div style={{ fontSize: 12, color: "#b45309" }}>ابتدا سطح بالاتر را مشخص کنید.</div>
      ) : (
        <>
          <select value={choice} onChange={(e) => setChoice(e.target.value)} style={inp}>
            <option value="">— انتخاب کنید —</option>
            {options.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
            <option value={NEW}>+ نوشتن دسته‌ی جدید</option>
          </select>

          {choice === NEW && (
            <div style={{ display: "grid", gap: 6, marginTop: 6 }}>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="نام فارسی دسته‌ی جدید" style={inp} />
              <input dir="ltr" value={newSlug} onChange={(e) => setNewSlug(e.target.value)} placeholder="slug-english (اختیاری)" style={inp} />
            </div>
          )}

          {err && <div style={{ color: "#dc2626", fontSize: 11, marginTop: 4 }}>{err}</div>}

          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <button
              type="button"
              onClick={save}
              style={{ fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 8, border: "1px solid #16a34a", background: "#16a34a", color: "#fff", cursor: "pointer" }}
            >
              ذخیره‌ی ویرایش
            </button>
            <button
              type="button"
              onClick={onCancel}
              style={{ fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", color: "#374151", cursor: "pointer" }}
            >
              انصراف
            </button>
          </div>
        </>
      )}
    </div>
  );
}