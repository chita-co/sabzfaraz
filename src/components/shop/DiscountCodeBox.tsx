"use client";

import { useState } from "react";
import { Ticket, Loader2, X } from "lucide-react";
import { validateDiscountCode } from "@/app/(shop)/checkout/discount-actions";

export default function DiscountCodeBox({
  orderTotal,
  onChange,
}: {
  orderTotal: number;
  onChange: (discountAmount: number, codeId: string | null) => void;
}) {
  const [input, setInput] = useState("");
  const [applied, setApplied] = useState<{ code: string; discountAmount: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApply() {
    setError(null);
    if (!input.trim()) { setError("کد تخفیف را وارد کنید."); return; }
    setLoading(true);
    const result = await validateDiscountCode(input.trim(), orderTotal);
    setLoading(false);
    if (result?.error) { setError(result.error); return; }
    if (result?.success && result.codeId && result.discountAmount !== undefined) {
      setApplied({ code: input.trim().toUpperCase(), discountAmount: result.discountAmount });
      onChange(result.discountAmount, result.codeId);
      setInput("");
    }
  }

  function handleRemove() {
    setApplied(null);
    onChange(0, null);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
      <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Ticket size={16} className="text-green-600" /> کد تخفیف
      </h2>

      {applied ? (
        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="text-sm">
            <p className="font-bold text-green-700" dir="ltr">{applied.code}</p>
            <p className="text-green-600 text-xs mt-0.5">{applied.discountAmount.toLocaleString("fa-IR")} تومان تخفیف اعمال شد</p>
          </div>
          <button onClick={handleRemove} className="text-gray-400 hover:text-red-500"><X size={18} /></button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="کد تخفیف خود را وارد کنید"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
            dir="ltr"
          />
          <button
            onClick={handleApply}
            disabled={loading}
            className="rounded-lg bg-gray-800 px-5 text-sm font-bold text-white hover:bg-gray-900 disabled:opacity-50 flex items-center gap-1"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : null}
            اعمال
          </button>
        </div>
      )}
      {error && <p className="text-red-600 text-xs mt-2">{error}</p>}
    </div>
  );
}