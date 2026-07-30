// src/components/admin/OrderStatusControl.tsx
"use client";

import { useState } from "react";
import { updateOrderStatus } from "@/app/admin/orders/actions";

const options = [
  { value: "PENDING", label: "در انتظار پرداخت" },
  { value: "PROCESSING", label: "در حال پردازش" },
  { value: "SHIPPED", label: "ارسال شده" },
  { value: "DELIVERED", label: "تحویل داده شده" },
  { value: "CANCELLED", label: "لغو شده" },
];

export default function OrderStatusControl({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);

  async function handleChange(newStatus: string) {
    setStatus(newStatus);
    setSaving(true);
    const result = await updateOrderStatus(orderId, newStatus);
    setSaving(false);
    if (result?.error) {
      alert(result.error);
      setStatus(currentStatus);
    }
  }

  return (
    <div className="admin-form-group no-print">
      <label>وضعیت سفارش</label>
      <select
        value={status}
        onChange={(e) => handleChange(e.target.value)}
        disabled={saving}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}