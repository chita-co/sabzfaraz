"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteOrder } from "@/app/admin/orders/actions";

export default function OrderDeleteButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("آیا از حذف این سفارش مطمئن هستید؟ این عملیات غیرقابل بازگشت است.")) return;
    setLoading(true);
    const result = await deleteOrder(orderId);
    setLoading(false);
    if (result?.error) {
      alert(result.error);
    } else {
      router.refresh();
    }
  }

  return (
    <button onClick={handleDelete} disabled={loading} className="admin-btn admin-btn-danger">
      <Trash2 size={14} />
    </button>
  );
}