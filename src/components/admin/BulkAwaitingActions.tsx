"use client";

import { confirmAwaitingBalance, rejectAwaitingBalance } from "@/app/admin/bulk-orders/money-actions";

export default function BulkAwaitingActions({ paymentId }: { paymentId: string }) {
  async function handleConfirm() {
    if (!confirm("آیا واریز را در حساب بانکی بررسی و تأیید کرده‌اید؟")) return;
    const r = await confirmAwaitingBalance(paymentId);
    if (r?.error) alert(r.error);
    else window.location.reload();
  }

  async function handleReject() {
    const reason = prompt("دلیل رد پرداخت را بنویسید (برای کاربر نمایش داده می‌شود):");
    if (!reason?.trim()) return;
    const r = await rejectAwaitingBalance(paymentId, reason);
    if (r?.error) alert(r.error);
    else window.location.reload();
  }

  return (
    <div className="mt-2 flex gap-2">
      <button type="button" onClick={handleConfirm} className="admin-btn admin-btn-primary">تأیید واریز</button>
      <button type="button" onClick={handleReject} className="admin-btn admin-btn-danger">رد واریز</button>
    </div>
  );
}