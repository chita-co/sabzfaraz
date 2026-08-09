"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import { confirmOfflinePayment } from "@/app/admin/orders/offline-payment-actions";

export default function ConfirmOfflinePaymentButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!confirm("آیا از تأیید پرداخت این سفارش مطمئن هستید؟")) return;
    setLoading(true);
    const result = await confirmOfflinePayment(orderId);
    setLoading(false);
    if (result?.error) alert(result.error);
    else router.refresh();
  }

  return (
    <button onClick={handleClick} disabled={loading} className="admin-btn admin-btn-primary flex items-center gap-2">
      <BadgeCheck size={16} /> {loading ? "در حال تأیید..." : "تأیید پرداخت"}
    </button>
  );
}