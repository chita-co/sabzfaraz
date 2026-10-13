"use client";

import { useState } from "react";
import { markRefundPaid, cancelRefundRequest } from "@/app/admin/bulk-orders/money-actions";

export default function BulkRefundAdminActions({ paymentId }: { paymentId: string }) {
  const [reference, setReference] = useState("");

  async function handlePaid() {
    if (!confirm("واریز را به حساب مشتری انجام داده‌اید؟")) return;
    const r = await markRefundPaid(paymentId, reference);
    if (r?.error) alert(r.error);
    else window.location.reload();
  }

  async function handleCancel() {
    if (!confirm("این درخواست بازپرداخت لغو شود؟")) return;
    const r = await cancelRefundRequest(paymentId);
    if (r?.error) alert(r.error);
    else window.location.reload();
  }

  return (
    <div className="mt-2 flex flex-col gap-2">
      <input
        value={reference}
        onChange={(e) => setReference(e.target.value)}
        placeholder="شماره پیگیری واریز"
        dir="ltr"
        className="rounded border px-2 py-1 text-sm"
      />
      <div className="flex gap-2">
        <button type="button" onClick={handlePaid} className="admin-btn admin-btn-primary">ثبت پرداخت شد</button>
        <button type="button" onClick={handleCancel} className="admin-btn admin-btn-danger">لغو</button>
      </div>
    </div>
  );
}