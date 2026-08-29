"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { XCircle } from "lucide-react";
import { rejectOfflinePayment } from "@/app/admin/orders/offline-payment-actions";

export default function RejectOfflinePaymentButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!confirm("آیا از رد این پرداخت مطمئن هستید؟ به کاربر پیامک اطلاع‌رسانی ارسال می‌شود.")) return;
    setLoading(true);
    const result = await rejectOfflinePayment(orderId);
    setLoading(false);
    if (result?.error) alert(result.error);
    else router.refresh();
  }

  return (
    <button onClick={handleClick} disabled={loading} className="admin-btn admin-btn-danger flex items-center gap-2">
      <XCircle size={16} /> {loading ? "در حال رد کردن..." : "رد پرداخت"}
    </button>
  );
}