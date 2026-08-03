"use client";

import { useState } from "react";
import Image from "next/image";
import { restockProduct } from "@/app/admin/out-of-stock/actions";

interface Row { id: string; name: string; sku: string; images: string[]; }

export default function OutOfStockManager({ products }: { products: Row[] }) {
  const [rows, setRows] = useState(products);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [qty, setQty] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleConfirm(id: string) {
    const n = Number(qty);
    if (!n || n <= 0) { alert("تعداد معتبر وارد کنید."); return; }
    setSaving(true);
    const result = await restockProduct(id, n);
    setSaving(false);
    if (result?.error) alert(result.error);
    else {
      setRows((prev) => prev.filter((r) => r.id !== id));
      setActiveId(null);
      setQty("");
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-5">محصولات تمام‌شده</h1>
      <div className="admin-card">
        <table className="admin-table">
          <thead><tr><th>تصویر</th><th>نام</th><th>کد محصول</th><th>شارژ محصول</th></tr></thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td>{p.images?.[0] ? <Image src={p.images[0]} alt="" width={48} height={48} className="object-cover rounded-lg" unoptimized /> : <div className="w-12 h-12 bg-gray-100 rounded-lg" />}</td>
                <td dir="ltr" className="text-left text-xs">{p.sku}</td>
                <td>
                  {activeId === p.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        placeholder="تعداد جدید"
                        value={qty}
                        onChange={(e) => setQty(e.target.value)}
                        className="admin-input"
                        style={{ width: 100 }}
                        autoFocus
                      />
                      <button onClick={() => handleConfirm(p.id)} disabled={saving} className="admin-btn admin-btn-primary">ثبت</button>
                      <button onClick={() => { setActiveId(null); setQty(""); }} className="admin-btn admin-btn-secondary">انصراف</button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="checkbox" checked={false} onChange={() => setActiveId(p.id)} />
                      شارژ محصول
                    </label>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="text-gray-500 text-sm text-center py-6">محصول تمام‌شده‌ای وجود ندارد.</p>}
      </div>
    </div>
  );
}