"use client";
import { useState } from "react";
import { deleteStaleCartsAction } from "@/app/admin/carts/actions";

export default function CartsCleanupButton() {
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(7);

  async function handleClick() {
    if (!confirm(`سبدهای خریدی که بیش از ${days} روز از آخرین تغییرشان گذشته حذف شوند؟`)) return;
    setLoading(true);
    const result = await deleteStaleCartsAction(days);
    setLoading(false);
    if (result?.success) alert(`${result.count} آیتم حذف شد.`);
  }

  return (
    <div className="flex items-center gap-2">
      <input type="number" min={1} value={days} onChange={(e) => setDays(Number(e.target.value))}
        className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-sm" />
      <span className="text-xs text-gray-500">روز</span>
      <button onClick={handleClick} disabled={loading} className="admin-btn admin-btn-secondary">
        پاکسازی سبدهای قدیمی
      </button>
    </div>
  );
}