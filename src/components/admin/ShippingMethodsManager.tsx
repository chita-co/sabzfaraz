"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  createShippingMethod, toggleShippingMethodActive, deleteShippingMethod,
  addWeightTier, deleteWeightTier,
} from "@/app/admin/shipping-methods/actions";
import AdminSwitch from "./AdminSwitch";

interface Tier { id: string; min_weight_grams: number; max_weight_grams: number; cost: number; }
interface Method { id: string; name: string; is_active: boolean; tiers: Tier[]; }

export default function ShippingMethodsManager({ methods }: { methods: Method[] }) {
  const [list, setList] = useState(methods);
  const [newMethodName, setNewMethodName] = useState("");

  async function handleAddMethod() {
    if (!newMethodName.trim()) return;
    const result = await createShippingMethod(newMethodName.trim());
    if (!result?.error) {
      setList((prev) => [...prev, { id: crypto.randomUUID(), name: newMethodName.trim(), is_active: true, tiers: [] }]);
      setNewMethodName("");
    }
  }

  async function handleToggle(id: string, value: boolean) {
    setList((prev) => prev.map((m) => (m.id === id ? { ...m, is_active: value } : m)));
    await toggleShippingMethodActive(id, value);
  }

  async function handleDeleteMethod(id: string) {
    if (!confirm("آیا از حذف این روش ارسال (و همه بازه‌های وزنی آن) مطمئن هستید؟")) return;
    setList((prev) => prev.filter((m) => m.id !== id));
    await deleteShippingMethod(id);
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-5">روش‌های ارسال و هزینه بر اساس وزن</h1>

      <div className="admin-card mb-5">
        <h2 className="font-bold text-gray-800 mb-3">افزودن روش ارسال جدید</h2>
        <div className="flex gap-2">
          <input type="text" placeholder="مثلاً: پست، تیپاکس، اسنپ" value={newMethodName} onChange={(e) => setNewMethodName(e.target.value)} className="admin-input flex-1" />
          <button onClick={handleAddMethod} className="admin-btn admin-btn-primary flex items-center gap-1"><Plus size={14} /> افزودن</button>
        </div>
      </div>

      <div className="space-y-5">
        {list.map((m) => <MethodCard key={m.id} method={m} onToggle={handleToggle} onDelete={handleDeleteMethod} />)}
        {list.length === 0 && <p className="text-gray-500 text-sm">هنوز روش ارسالی ثبت نشده.</p>}
      </div>
    </div>
  );
}

function MethodCard({
  method, onToggle, onDelete,
}: { method: Method; onToggle: (id: string, value: boolean) => void; onDelete: (id: string) => void }) {
  const [tiers, setTiers] = useState(method.tiers);
  const [minKg, setMinKg] = useState("");
  const [maxKg, setMaxKg] = useState("");
  const [cost, setCost] = useState("");

  async function handleAddTier() {
    if (!minKg || !maxKg || !cost) return;
    const minGrams = Math.round(Number(minKg) * 1000);
    const maxGrams = Math.round(Number(maxKg) * 1000);
    const result = await addWeightTier(method.id, minGrams, maxGrams, Number(cost));
    if (!result?.error) {
      setTiers((prev) => [...prev, { id: crypto.randomUUID(), min_weight_grams: minGrams, max_weight_grams: maxGrams, cost: Number(cost) }]);
      setMinKg(""); setMaxKg(""); setCost("");
    }
  }

  async function handleDeleteTier(id: string) {
    setTiers((prev) => prev.filter((t) => t.id !== id));
    await deleteWeightTier(id);
  }

  return (
    <div className="admin-card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-800">{method.name}</h2>
        <div className="flex items-center gap-3">
          <AdminSwitch checked={method.is_active} onChange={(v) => onToggle(method.id, v)} label={method.is_active ? "فعال" : "غیرفعال"} />
          <button onClick={() => onDelete(method.id)} className="admin-btn admin-btn-danger"><Trash2 size={14} /></button>
        </div>
      </div>

      <table className="admin-table mb-3">
        <thead><tr><th>از (کیلوگرم)</th><th>تا (کیلوگرم)</th><th>هزینه (تومان)</th><th></th></tr></thead>
        <tbody>
          {[...tiers].sort((a, b) => a.min_weight_grams - b.min_weight_grams).map((t) => (
            <tr key={t.id}>
              <td>{(t.min_weight_grams / 1000).toLocaleString("fa-IR")}</td>
              <td>{(t.max_weight_grams / 1000).toLocaleString("fa-IR")}</td>
              <td>{t.cost.toLocaleString("fa-IR")}</td>
              <td><button onClick={() => handleDeleteTier(t.id)} className="admin-btn admin-btn-danger"><Trash2 size={12} /></button></td>
            </tr>
          ))}
        </tbody>
      </table>
      {tiers.length === 0 && <p className="text-gray-400 text-xs mb-3">هنوز بازه‌ی وزنی‌ای برای این روش تعریف نشده.</p>}

      <div className="grid grid-cols-3 gap-2">
        <input type="number" step="0.1" placeholder="از (کیلوگرم)" value={minKg} onChange={(e) => setMinKg(e.target.value)} className="admin-input" />
        <input type="number" step="0.1" placeholder="تا (کیلوگرم)" value={maxKg} onChange={(e) => setMaxKg(e.target.value)} className="admin-input" />
        <input type="number" placeholder="هزینه (تومان)" value={cost} onChange={(e) => setCost(e.target.value)} className="admin-input" />
      </div>
      <button onClick={handleAddTier} className="admin-btn admin-btn-secondary mt-2 flex items-center gap-1"><Plus size={14} /> افزودن بازه</button>
    </div>
  );
}