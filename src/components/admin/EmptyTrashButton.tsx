"use client";
import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { emptyOrdersTrashAction } from "@/app/admin/orders/actions";

export default function EmptyTrashButton() {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("همه‌ی سفارش‌های داخل سطل زباله برای همیشه حذف می‌شوند. این عملیات غیرقابل بازگشته. مطمئنید؟")) return;
    startTransition(async () => {
      const res = await emptyOrdersTrashAction();
      if (res.error) return alert(res.error);
      alert(`${res.count} سفارش برای همیشه حذف شد.`);
      window.location.reload();
    });
  }

  return (
    <button onClick={handleClick} disabled={isPending} className="admin-btn admin-btn-danger flex items-center gap-2">
      <Trash2 size={14} /> {isPending ? "در حال حذف..." : "خالی‌کردن سطل زباله"}
    </button>
  );
}