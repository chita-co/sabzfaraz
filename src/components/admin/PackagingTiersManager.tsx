"use client";

import { useState } from "react";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { addPackagingTier, updatePackagingTier, deletePackagingTier } from "@/app/admin/packaging/actions";

interface Tier { id: string; min_weight_grams: number; max_weight_grams: number; cost: number; }

export default function PackagingTiersManager({ tiers: initial }: { tiers: Tier[] }) {
  const [tiers, setTiers] = useState<Tier[]>(initial);
  const [minKg, setMinKg] = useState("");
  const [maxKg, setMaxKg] = useState("");
  const [cost, setCost] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMinKg, setEditMinKg] = useState("");
  const [editMaxKg, setEditMaxKg] = useState("");
  const [editCost, setEditCost] = useState("");

  async function handleAdd() {
    if (minKg === "" || maxKg === "" || cost === "") return;
    setError(null);
    const minGrams = Math.round(Number(minKg) * 1000);
    const maxGrams = Math.round(Number(maxKg) * 1000);
    const result = await addPackagingTier(minGrams, maxGrams, Number(cost));
    if ("error" in result && result.error) { setError(result.error); return; }
    if ("tier" in result && result.tier) {
      setTiers((prev) => [...prev, result.tier as Tier]);
      setMinKg(""); setMaxKg(""); setCost("");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("این بازه حذف شود؟")) return;
    const backup = tiers;
    setTiers((prev) => prev.filter((t) => t.id !== id));
    const result = await deletePackagingTier(id);
    if (result?.error) { setTiers(backup); setError(result.error); }
  }

  function startEdit(t: Tier) {
    setEditingId(t.id);
    setEditMinKg((t.min_weight_grams / 1000).toString());
    setEditMaxKg((t.max_weight_grams / 1000).toString());
    setEditCost(t.cost.toString());
  }

  async function saveEdit(id: string) {
    if (editMinKg === "" || editMaxKg === "" || editCost === "") return;
    setError(null);
    const minGrams = Math.round(Number(editMinKg) * 1000);
    const maxGrams = Math.round(Number(editMaxKg) * 1000);
    const result = await updatePackagingTier(id, minGrams, maxGrams, Number(editCost));
    if (result?.error) { setError(result.error); return; }
    setTiers((prev) => prev.map((t) => (t.id === id ? { ...t, min_weight_grams: minGrams, max_weight_grams: maxGrams, cost: Number(editCost) } : t)));
    setEditingId(null);
  }

  const sorted = [...tiers].sort((a, b) => a.min_weight_grams - b.min_weight_grams);

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">هزینه بسته‌بندی بر اساس وزن</h1>
      <p className="text-sm text-gray-500 mb-5">
        این هزینه جدا از هزینه ارسال است. بر اساس وزن کل سفارش مشتری به‌صورت خودکار در صفحه تکمیل خرید، خلاصه سفارش و فاکتور اضافه می‌شود
        و با ارسال رایگان (بالای ۱۰ میلیون تومان) هم حذف نمی‌شود.
        اگر وزن سفارش از آخرین بازه بیشتر باشد، هزینه آخرین بازه اعمال می‌شود.
      </p>

      <div className="admin-card">
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <table className="admin-table mb-3">
          <thead><tr><th>از (کیلوگرم)</th><th>تا (کیلوگرم)</th><th>هزینه (تومان)</th><th></th></tr></thead>
          <tbody>
            {sorted.map((t) => (
              <tr key={t.id}>
                {editingId === t.id ? (
                  <>
                    <td><input type="number" step="0.001" value={editMinKg} onChange={(e) => setEditMinKg(e.target.value)} className="admin-input" style={{ width: 90 }} /></td>
                    <td><input type="number" step="0.001" value={editMaxKg} onChange={(e) => setEditMaxKg(e.target.value)} className="admin-input" style={{ width: 90 }} /></td>
                    <td><input type="number" value={editCost} onChange={(e) => setEditCost(e.target.value)} className="admin-input" style={{ width: 110 }} /></td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => saveEdit(t.id)} className="admin-btn admin-btn-primary"><Check size={12} /></button>
                        <button onClick={() => setEditingId(null)} className="admin-btn admin-btn-secondary"><X size={12} /></button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{(t.min_weight_grams / 1000).toLocaleString("fa-IR")}</td>
                    <td>{(t.max_weight_grams / 1000).toLocaleString("fa-IR")}</td>
                    <td>{t.cost.toLocaleString("fa-IR")}</td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => startEdit(t)} className="admin-btn admin-btn-secondary"><Pencil size={12} /></button>
                        <button onClick={() => handleDelete(t.id)} className="admin-btn admin-btn-danger"><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length === 0 && <p className="text-gray-400 text-xs mb-3">هنوز بازه‌ی وزنی‌ای برای بسته‌بندی تعریف نشده؛ تا آن موقع هزینه بسته‌بندی صفر است.</p>}

        <div className="grid grid-cols-3 gap-2">
          <input type="number" step="0.001" placeholder="از (کیلوگرم)" value={minKg} onChange={(e) => setMinKg(e.target.value)} className="admin-input" />
          <input type="number" step="0.001" placeholder="تا (کیلوگرم)" value={maxKg} onChange={(e) => setMaxKg(e.target.value)} className="admin-input" />
          <input type="number" placeholder="هزینه (تومان)" value={cost} onChange={(e) => setCost(e.target.value)} className="admin-input" />
        </div>
        <button onClick={handleAdd} className="admin-btn admin-btn-secondary mt-2 flex items-center gap-1"><Plus size={14} /> افزودن بازه</button>
      </div>
    </div>
  );
}