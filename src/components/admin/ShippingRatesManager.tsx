"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  addShippingRate,
  updateShippingRate,
  deleteShippingRate,
  updateDefaultShippingCost,
} from "@/app/admin/shipping/actions";
import ProvinceCitySelect from "@/components/shared/ProvinceCitySelect";

interface Rate { id: string; province: string; city: string | null; cost: number; }

export default function ShippingRatesManager({
  rates,
  defaultCost,
}: {
  rates: Rate[];
  defaultCost: number;
}) {
  const [list, setList] = useState(rates);
  const [defCost, setDefCost] = useState(defaultCost.toString());
  const [newProvince, setNewProvince] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newCost, setNewCost] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [savingDefault, setSavingDefault] = useState(false);

  async function handleAdd() {
    if (!newProvince || !newCost) return;
    setError(null);
    const result = await addShippingRate(newProvince, newCity || null, Number(newCost));
    if (result?.error) {
      setError(result.error);
      return;
    }
    setList((prev) => [
      ...prev,
      { id: crypto.randomUUID(), province: newProvince, city: newCity || null, cost: Number(newCost) },
    ]);
    setNewProvince("");
    setNewCity("");
    setNewCost("");
  }

  async function handleUpdate(id: string, cost: string) {
    setList((prev) => prev.map((r) => (r.id === id ? { ...r, cost: Number(cost) } : r)));
    await updateShippingRate(id, Number(cost));
  }

  async function handleDelete(id: string) {
    if (!confirm("آیا از حذف این ردیف مطمئن هستید؟")) return;
    setList((prev) => prev.filter((r) => r.id !== id));
    await deleteShippingRate(id);
  }

  async function handleSaveDefault() {
    setSavingDefault(true);
    await updateDefaultShippingCost(Number(defCost));
    setSavingDefault(false);
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-5">هزینه ارسال (تیپاکس)</h1>

      <div className="admin-card mb-5">
        <h2 className="font-bold text-gray-800 mb-3">هزینه پیش‌فرض (برای استان‌هایی که در لیست نیستند)</h2>
        <div className="flex gap-2">
          <input
            type="number"
            value={defCost}
            onChange={(e) => setDefCost(e.target.value)}
            className="admin-input flex-1"
            placeholder="مبلغ به تومان"
          />
          <button onClick={handleSaveDefault} disabled={savingDefault} className="admin-btn admin-btn-primary">
            {savingDefault ? "در حال ذخیره..." : "ذخیره"}
          </button>
        </div>
      </div>

      <div className="admin-card mb-5">
        <h2 className="font-bold text-gray-800 mb-1">افزودن نرخ جدید</h2>
        <p className="text-xs text-gray-500 mb-3">
          اگه فقط استان رو انتخاب کنی (شهر رو خالی بذاری)، این هزینه برای کل اون استان اعمال می‌شه. اگه شهر رو هم انتخاب کنی، فقط مخصوص همون شهر می‌شه.
        </p>
        <div className="grid sm:grid-cols-4 gap-2">
          <ProvinceCitySelect
            province={newProvince}
            city={newCity}
            onProvinceChange={setNewProvince}
            onCityChange={setNewCity}
            cityOptional
            provinceName="newProvince"
            cityName="newCity"
          />
          <input
            type="number"
            placeholder="هزینه (تومان)"
            value={newCost}
            onChange={(e) => setNewCost(e.target.value)}
            className="admin-input"
          />
        </div>
        <button onClick={handleAdd} className="admin-btn admin-btn-primary flex items-center justify-center gap-2 mt-3">
          <Plus size={16} /> افزودن
        </button>
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      </div>

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr><th>استان</th><th>شهر</th><th>هزینه ارسال</th><th></th></tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id}>
                <td>{r.province}</td>
                <td>{r.city ?? <span className="text-xs text-gray-400">همه‌ی شهرهای استان</span>}</td>
                <td>
                  <input
                    type="number"
                    defaultValue={r.cost}
                    onBlur={(e) => handleUpdate(r.id, e.target.value)}
                    className="admin-input"
                    style={{ width: 140 }}
                  />
                </td>
                <td>
                  <button className="admin-btn admin-btn-danger" onClick={() => handleDelete(r.id)}>
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <p className="text-gray-500 text-sm text-center py-6">هنوز نرخی ثبت نشده.</p>}
      </div>
    </div>
  );
}