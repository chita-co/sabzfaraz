"use client";

import { useState } from "react";
import { startOrderTracking } from "@/app/admin/orders/actions";
import { getTrackingStageNumber } from "@/lib/tracking";

export default function StartTrackingButton({
  orderId,
  trackingStartedAt,
}: {
  orderId: string;
  trackingStartedAt: string | null;
}) {
  const [started, setStarted] = useState(trackingStartedAt);
  const [loading, setLoading] = useState(false);

  async function handleStart() {
    setLoading(true);
    const result = await startOrderTracking(orderId);
    setLoading(false);
    if (!result?.error) setStarted(new Date().toISOString());
  }

  if (started) {
    const stage = getTrackingStageNumber(started);
    return (
      <p className="text-sm text-green-700">
        پیگیری خودکار فعال است — در حال حاضر مرحله {stage} از ۵
      </p>
    );
  }

  return (
    <button onClick={handleStart} disabled={loading} className="admin-btn admin-btn-primary">
      {loading ? "در حال فعال‌سازی..." : "شروع پیگیری خودکار سفارش"}
    </button>
  );
}