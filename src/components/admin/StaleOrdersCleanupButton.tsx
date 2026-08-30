"use client";
import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteStaleOrdersAction } from "@/app/admin/orders/actions";

export default function StaleOrdersCleanupButton() {
  const [days, setDays] = useState(3);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm(`همه‌ی سفارش‌های «در انتظار پرداخت» که بیش از ${days} روز از ثبتشون گذشته به سطل زباله منتقل بشن؟`)) return;
    startTransition(async () => {
      const res = await deleteStaleOrdersAction(days);
      if (res.error) return alert(res.error);
      alert(`${res.count} سفارش رهاشده به سطل زباله منتقل شد.`);
      window.location.reload();
    });
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <input type="number" min={1} value={days} onChange={(e) => setDays(Number(e.target.value) || 1)} className="admin-input" style={{ width: 70 }} />
      <span style={{ fontSize: 12.5, color: "#6b7280" }}>روز بدون پرداخت</span>
      <button onClick={handleClick} disabled={isPending} className="admin-btn admin-btn-danger" style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Trash2 size={14} /> {isPending ? "در حال انتقال..." : "انتقال سفارش‌های رهاشده به سطل زباله"}
      </button>
    </div>
  );
}