"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteOrder } from "@/app/admin/orders/actions";

export default function OrderDeleteButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("این سفارش به سطل زباله منتقل می‌شود و بعداً هم قابل بازگردانی است. ادامه می‌دهید؟")) return;
    setLoading(true);
    const result = await deleteOrder(orderId);
    setLoading(false);
    if (result?.error) {
      alert(result.error);
    } else {
      window.dispatchEvent(new Event("admin-orders-changed"));
      router.refresh();
    }
  }

  return (
    <button onClick={handleDelete} disabled={loading} className="admin-btn admin-btn-danger">
      <Trash2 size={14} />
    </button>
  );
}