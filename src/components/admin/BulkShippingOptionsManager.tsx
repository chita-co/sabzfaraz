"use client";

import { useState } from "react";
import {
  createBulkShippingOption,
  updateBulkShippingOptionPrice,
  setBulkShippingOptionActive,
  deleteBulkShippingOption,
} from "@/app/admin/bulk-orders/shipping-options-actions";

type Opt = { id: string; name: string; price: number; is_active: boolean; sort_order: number };

const toInt = (v: string) => Number(v.replace(/[,\s٬]/g, ""));

export default function BulkShippingOptionsManager({ options }: { options: Opt[] }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [prices, setPrices] = useState<Record<string, string>>(
    Object.fromEntries(options.map((o) => [o.id, String(o.price)]))
  );

  async function handleAdd() {
    const r = await createBulkShippingOption(name, toInt(price));
    if (r?.error) alert(r.error);
    else window.location.reload();
  }

  async function handleSavePrice(id: string) {
    const r = await updateBulkShippingOptionPrice(id, toInt(prices[id] ?? ""));
    if (r?.error) alert(r.error);
    else window.location.reload();
  }

  async function handleToggle(o: Opt) {
    const r = await setBulkShippingOptionActive(o.id, !o.is_active);
    if (r?.error) alert(r.error);
    else window.location.reload();
  }

  async function handleDelete(o: Opt) {
    if (!confirm(`نحوه‌ی ارسال «${o.name}» حذف شود؟`)) return;
    const r = await deleteBulkShippingOption(o.id);
    if (r?.error) alert(r.error);
    else window.location.reload();
  }

  return (
    <div className="space-y-5">
      <div className="admin-card">
        <h2 className="font-bold text-gray-800 mb-3">افزودن نحوه‌ی ارسال</h2>
        <div className="flex flex-wrap gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="نام (مثلاً پست پیشتاز)" className="border rounded px-3 py-2 text-sm" />
          <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="هزینه (تومان)" dir="ltr" className="border rounded px-3 py-2 text-sm" />
          <button type="button" onClick={handleAdd} className="admin-btn admin-btn-primary">افزودن</button>
        </div>
      </div>

      <div className="admin-card">
        <h2 className="font-bold text-gray-800 mb-3">فهرست</h2>
        {options.length === 0 ? (
          <p className="text-sm text-gray-500">هنوز نحوه‌ی ارسالی تعریف نشده است.</p>
        ) : (
          <div className="space-y-3">
            {options.map((o) => (
              <div key={o.id} className="flex flex-wrap items-center gap-2 border-b pb-3">
                <span className="font-medium text-gray-800 min-w-160px">{o.name}</span>
                <input
                  value={prices[o.id] ?? ""}
                  onChange={(e) => setPrices((p) => ({ ...p, [o.id]: e.target.value }))}
                  dir="ltr"
                  className="border rounded px-3 py-1 text-sm w-40"
                />
                <button type="button" onClick={() => handleSavePrice(o.id)} className="admin-btn admin-btn-secondary">ذخیره قیمت</button>
                <button type="button" onClick={() => handleToggle(o)} className="admin-btn admin-btn-secondary">
                  {o.is_active ? "غیرفعال کردن" : "فعال کردن"}
                </button>
                <button type="button" onClick={() => handleDelete(o)} className="admin-btn admin-btn-danger">حذف</button>
                {!o.is_active && <span className="text-xs text-gray-500">غیرفعال</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}