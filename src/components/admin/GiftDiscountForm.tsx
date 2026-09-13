"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { issueGiftDiscountCode } from "@/app/admin/orders/gift-discount-actions";

export default function GiftDiscountForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [percent, setPercent] = useState("");
  const [days, setDays] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ code: string; percent: number; days: number } | null>(null);

  async function handleSubmit() {
    const p = Number(percent);
    const d = Number(days);
    if (!p || p <= 0 || p > 100) return alert("درصد تخفیف را درست وارد کنید (۱ تا ۱۰۰).");
    if (!d || d <= 0) return alert("مدت اعتبار (روز) را درست وارد کنید.");
    if (!confirm(`کد تخفیف ${p}% به مدت ${d} روز برای این کاربر ساخته و پیامک شود؟`)) return;

    setLoading(true);
    const res = await issueGiftDiscountCode(orderId, p, d);
    setLoading(false);

    if (res?.error) return alert(res.error);
    if (res?.success && res.code) {
      setResult({ code: res.code, percent: p, days: d });
      setPercent("");
      setDays("");
      router.refresh();
    }
  }

  return (
    <div className="admin-card">
      <h2 className="font-bold text-gray-800 mb-3">🎁 هدیه‌ی کد تخفیف اختصاصی</h2>
      <div className="admin-form-group">
        <label>درصد تخفیف</label>
        <input type="number" min={1} max={100} value={percent} onChange={(e) => setPercent(e.target.value)} placeholder="مثلاً ۱۵" disabled={loading} />
      </div>
      <div className="admin-form-group" style={{ marginTop: 10 }}>
        <label>مدت اعتبار (روز)</label>
        <input type="number" min={1} value={days} onChange={(e) => setDays(e.target.value)} placeholder="مثلاً ۳۰" disabled={loading} />
      </div>
      <button type="button" onClick={handleSubmit} disabled={loading} className="admin-btn admin-btn-primary" style={{ marginTop: 12, width: "100%" }}>
        {loading ? "در حال ساخت..." : "ساخت کد تخفیف و ارسال پیامک"}
      </button>
      {result && (
        <p style={{ fontSize: 11.5, color: "#16a34a", marginTop: 10 }}>
          کد <span dir="ltr" style={{ fontWeight: 700 }}>{result.code}</span> ({result.percent}٪ به مدت {result.days} روز) ساخته شد و پیامک برای مشتری ارسال شد.
        </p>
      )}
    </div>
  );
}