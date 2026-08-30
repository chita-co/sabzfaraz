"use client";
import { useState } from "react";
import { updateOrderItemFulfillmentAction } from "@/app/partner/orders/actions";

const labels: Record<string, string> = { PENDING: "در انتظار", PREPARING: "در حال آماده‌سازی", READY_FOR_PICKUP: "آماده تحویل به پیک", PICKED_UP: "تحویل به پیک", CANCELLED: "لغو‌شده" };

export default function PartnerOrderStatusControl({ itemId, currentStatus }: { itemId: string; currentStatus: string }) {
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);

  async function handleChange(next: "PREPARING" | "READY_FOR_PICKUP") {
    setSaving(true);
    const res = await updateOrderItemFulfillmentAction(itemId, next);
    setSaving(false);
    if (!res.error) setStatus(next);
  }

  if (status === "PICKED_UP" || status === "CANCELLED") return <span>{labels[status]}</span>;

  return (
    <select value={status} disabled={saving} onChange={(e) => handleChange(e.target.value as "PREPARING" | "READY_FOR_PICKUP")} className="partner-input" style={{ fontSize: 12, padding: "4px 8px" }}>
      <option value="PENDING">در انتظار</option>
      <option value="PREPARING">در حال آماده‌سازی</option>
      <option value="READY_FOR_PICKUP">آماده تحویل به پیک</option>
    </select>
  );
}