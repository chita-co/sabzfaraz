"use client";

import { useState } from "react";
import { CreditCard, Landmark } from "lucide-react";
import { confirmOfflineDepositPayment } from "@/app/(shop)/bulk-order/deposit-actions";

interface Bank { id: string; bank_name: string; account_holder_name: string; card_number: string | null; sheba_number: string | null; logo_slug: string; }

export default function BulkDepositBankList({ requestId, banks }: { requestId: string; banks: Bank[] }) {
  const [confirmType, setConfirmType] = useState<"CARD_TO_CARD" | "SHEBA" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm() {
    if (!confirmType) return;
    setSubmitting(true);
    const result = await confirmOfflineDepositPayment(requestId, confirmType);
    setSubmitting(false);
    if (result?.error) alert(result.error);
    else window.location.reload();
  }

  return (
    <div>
      <div className="bank-accounts-row">
        {banks.map((b) => (
          <div key={b.id} className="bank-account-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.logo_slug === "generic" ? "/banks/generic.svg" : `/banks/${b.logo_slug}.png`} alt={b.bank_name} className="bank-account-logo" />
            <p className="bank-account-name">{b.bank_name}</p>
            <p className="bank-account-holder">{b.account_holder_name}</p>
            {b.card_number && <p className="bank-account-number" dir="ltr">کارت: {b.card_number}</p>}
            {b.sheba_number && <p className="bank-account-number" dir="ltr">شبا: {b.sheba_number}</p>}
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-4">
        <button onClick={() => setConfirmType("CARD_TO_CARD")} className="admin-btn admin-btn-primary flex-1 justify-center">
          <CreditCard size={15} /> پرداخت کارت‌به‌کارت انجام شد
        </button>
        <button onClick={() => setConfirmType("SHEBA")} className="admin-btn admin-btn-secondary flex-1 justify-center">
          <Landmark size={15} /> پرداخت شبا انجام شد
        </button>
      </div>

      {confirmType && (
        <div className="trust-badge-modal-overlay" onClick={() => setConfirmType(null)}>
          <div className="trust-badge-modal" style={{ padding: 24 }} onClick={(e) => e.stopPropagation()}>
            <p className="text-sm text-gray-800 mb-5">
              آیا از انجام پرداخت {confirmType === "CARD_TO_CARD" ? "کارت‌به‌کارت" : "شبا"} مطمئن هستید؟ با تأیید، درخواست شما برای بررسی ارسال می‌شود.
            </p>
            <div className="flex gap-2">
              <button onClick={handleConfirm} disabled={submitting} className="admin-btn admin-btn-primary flex-1">{submitting ? "در حال ثبت..." : "تأیید"}</button>
              <button onClick={() => setConfirmType(null)} className="admin-btn admin-btn-secondary flex-1">انصراف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}