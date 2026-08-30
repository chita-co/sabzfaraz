"use client";
import { useTransition } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { restoreOrderAction, permanentlyDeleteOrderAction } from "@/app/admin/orders/actions";

export default function TrashedOrderActions({ orderId }: { orderId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleRestore() {
    startTransition(async () => {
      const res = await restoreOrderAction(orderId);
      if (res.error) alert(res.error);
    });
  }

  function handlePermanentDelete() {
    if (!confirm("این سفارش برای همیشه حذف می‌شود و دیگر قابل بازگردانی نیست. مطمئنید؟")) return;
    startTransition(async () => {
      const res = await permanentlyDeleteOrderAction(orderId);
      if (res.error) alert(res.error);
    });
  }

  return (
    <div className="flex gap-2">
      <button onClick={handleRestore} disabled={isPending} className="admin-btn admin-btn-primary flex items-center gap-1">
        <RotateCcw size={13} /> بازگردانی
      </button>
      <button onClick={handlePermanentDelete} disabled={isPending} className="admin-btn admin-btn-danger flex items-center gap-1">
        <Trash2 size={13} /> حذف کامل
      </button>
    </div>
  );
}