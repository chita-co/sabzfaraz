"use client";

import { useState } from "react";
import { submitRefundDetails } from "@/app/(shop)/bulk-order/refund-actions";

export default function BulkRefundDetailsForm({
  paymentId,
  method,
  amount,
}: {
  paymentId: string;
  method: string;
  amount: number;
}) {
  const isCard = method === "CARD_TO_CARD";
  const [holder, setHolder] = useState("");
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    setBusy(true);
    const r = await submitRefundDetails(paymentId, { holderName: holder, value });
    setBusy(false);
    if (r?.error) alert(r.error);
    else window.location.reload();
  }

  return (
    <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-2">
      <p className="text-xs text-gray-700">
        برای دریافت بازپرداخت {amount.toLocaleString("fa-IR")} تومان، {isCard ? "شماره کارت" : "شماره شبا"} و نام صاحب حساب را وارد کنید.
      </p>
      <input
        value={holder}
        onChange={(e) => setHolder(e.target.value)}
        placeholder="نام و نام خانوادگی صاحب حساب"
        className="w-full rounded border px-3 py-2 text-sm"
      />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={isCard ? "شماره کارت ۱۶ رقمی" : "IR..."}
        dir="ltr"
        className="w-full rounded border px-3 py-2 text-sm"
      />
      <button
        type="button"
        disabled={busy}
        onClick={handleSubmit}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        ثبت اطلاعات حساب
      </button>
    </div>
  );
}