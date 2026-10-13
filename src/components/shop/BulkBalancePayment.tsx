"use client";

import { useState } from "react";
import { payBalanceOnline, payBalanceWallet } from "@/app/(shop)/bulk-order/balance-actions";
import BulkDepositBankList from "@/components/shop/BulkDepositBankList";

interface Bank {
  id: string;
  bank_name: string;
  account_holder_name: string;
  card_number: string | null;
  sheba_number: string | null;
  logo_slug: string;
}

export default function BulkBalancePayment({
  requestId,
  balance,
  banks,
}: {
  requestId: string;
  balance: number;
  banks: Bank[];
}) {
  const [showOffline, setShowOffline] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleOnline() {
    setBusy(true);
    const r = await payBalanceOnline(requestId);
    setBusy(false);
    if (r?.error) alert(r.error);
  }

  async function handleWallet() {
    if (!confirm(`مبلغ ${balance.toLocaleString("fa-IR")} تومان از کیف پول شما کسر شود؟`)) return;
    setBusy(true);
    const r = await payBalanceWallet(requestId);
    setBusy(false);
    if (r?.error) alert(r.error);
    else window.location.reload();
  }

  return (
    <div className="rounded-lg border border-red-200 bg-red-50/40 p-4 space-y-3">
      <p className="font-semibold text-gray-800">
        مبلغ مانده برای پرداخت: {balance.toLocaleString("fa-IR")} تومان
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={handleOnline}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          پرداخت آنلاین
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={handleWallet}
          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          پرداخت از کیف پول
        </button>
        <button
          type="button"
          onClick={() => setShowOffline((v) => !v)}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm"
        >
          کارت به کارت / شبا
        </button>
      </div>
      {showOffline && <BulkDepositBankList requestId={requestId} banks={banks} mode="BALANCE" />}
    </div>
  );
}