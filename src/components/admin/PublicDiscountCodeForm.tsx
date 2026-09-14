"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { createPublicDiscountCode } from "@/app/admin/settings/general/public-discount-actions";

export default function PublicDiscountCodeForm() {
  const [percent, setPercent] = useState("");
  const [days, setDays] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ code: string; percent: number; days: number; maxUses: number } | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit() {
    const p = Number(percent);
    const d = Number(days);
    const m = Number(maxUses);
    if (!p || p <= 0 || p > 100) return alert("درصد تخفیف را درست وارد کنید (۱ تا ۱۰۰).");
    if (!d || d <= 0) return alert("مدت اعتبار (روز) را درست وارد کنید.");
    if (!m || m <= 0 || !Number.isInteger(m)) return alert("تعداد دفعات مجاز استفاده را درست وارد کنید.");

    setLoading(true);
    const res = await createPublicDiscountCode(p, d, m);
    setLoading(false);

    if (res?.error) return alert(res.error);
    if (res?.success && res.code) {
      setResult({ code: res.code, percent: p, days: d, maxUses: m });
      setCopied(false);
      setPercent("");
      setDays("");
      setMaxUses("");
    }
  }

  function handleCopy() {
    if (!result) return;
    navigator.clipboard.writeText(result.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="admin-card">
      <h2 className="font-bold text-gray-800 mb-3">🏷️ کد تخفیف همگانی</h2>
      <p className="text-xs text-gray-500 mb-3">
        این کد به هیچ کاربر خاصی وابسته نیست. تا رسیدن به سقف تعداد استفاده یا پایان مدت اعتبار — هرکدام زودتر برسد — هر کسی که کد را داشته باشد می‌تواند از آن استفاده کند (حتی چند بار).
      </p>
      <div className="admin-form-group">
        <label>درصد تخفیف</label>
        <input type="number" min={1} max={100} value={percent} onChange={(e) => setPercent(e.target.value)} placeholder="مثلاً ۲۰" disabled={loading} />
      </div>
      <div className="admin-form-group" style={{ marginTop: 10 }}>
        <label>مدت اعتبار (روز)</label>
        <input type="number" min={1} value={days} onChange={(e) => setDays(e.target.value)} placeholder="مثلاً ۷" disabled={loading} />
      </div>
      <div className="admin-form-group" style={{ marginTop: 10 }}>
        <label>سقف تعداد دفعات استفاده</label>
        <input type="number" min={1} value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="مثلاً ۱۰۰۰" disabled={loading} />
      </div>
      <button type="button" onClick={handleSubmit} disabled={loading} className="admin-btn admin-btn-primary" style={{ marginTop: 12, width: "100%" }}>
        {loading ? "در حال ساخت..." : "ساخت کد تخفیف"}
      </button>

      {result && (
        <div className="mt-3 flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
          <div>
            <p className="font-bold text-green-700 text-lg" dir="ltr">{result.code}</p>
            <p className="text-green-600 text-xs mt-0.5">
              {result.percent}٪ تخفیف — حداکثر {result.maxUses.toLocaleString("fa-IR")} بار — تا {result.days} روز معتبر است
            </p>
          </div>
          <button onClick={handleCopy} className="text-green-700 hover:text-green-900" title="کپی کد">
            {copied ? <Check size={20} /> : <Copy size={20} />}
          </button>
        </div>
      )}
    </div>
  );
}