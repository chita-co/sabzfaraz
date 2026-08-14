"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { confirmAuctionWinnerOfflinePayment, rejectAuctionWinnerOfflinePayment } from "@/app/admin/auctions/winner-payment-actions";

export default function ConfirmAuctionPaymentButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");

  async function handleConfirm() {
    if (!confirm("آیا از تأیید این پرداخت مطمئن هستید؟ سفارش نهایی خواهد شد.")) return;
    setLoading(true);
    const result = await confirmAuctionWinnerOfflinePayment(orderId);
    setLoading(false);
    if (result?.error) alert(result.error);
    else window.location.reload();
  }

  async function handleReject() {
    if (!reason.trim()) return;
    setLoading(true);
    const result = await rejectAuctionWinnerOfflinePayment(orderId, reason.trim());
    setLoading(false);
    if (result?.error) alert(result.error);
    else window.location.reload();
  }

  return (
    <div className="flex gap-1">
      <button onClick={handleConfirm} disabled={loading} className="admin-btn admin-btn-primary"><Check size={13} /> تأیید</button>
      <button onClick={() => setShowReject(true)} disabled={loading} className="admin-btn admin-btn-danger"><X size={13} /> رد</button>

      {showReject && (
        <div className="admin-modal-overlay" onClick={() => setShowReject(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-bold text-gray-900 mb-4">دلیل رد پرداخت</h2>
            <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} className="admin-input w-full mb-4" />
            <div className="flex gap-2">
              <button onClick={handleReject} disabled={loading} className="admin-btn admin-btn-danger flex-1">تأیید رد</button>
              <button onClick={() => setShowReject(false)} className="admin-btn admin-btn-secondary flex-1">انصراف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}