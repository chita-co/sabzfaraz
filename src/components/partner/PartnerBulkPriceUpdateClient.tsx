"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { bulkAdjustPartnerProductPricesAction } from "@/app/partner/products/actions";

export default function PartnerBulkPriceUpdateClient() {
  const [adjustType, setAdjustType] = useState<"percent" | "fixed">("percent");
  const [direction, setDirection] = useState<"increase" | "decrease">("increase");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return toast.error("مقدار تغییر را وارد کنید.");
    setLoading(true);
    const res = await bulkAdjustPartnerProductPricesAction({
      adjustType,
      direction,
      amount: Number(amount),
      roundingStep: 0,
      roundingMode: "nearest",
    });
    setLoading(false);
    if (res?.error) return toast.error(res.error);
    toast.success(`قیمت ${res.updatedCount} محصول به‌روزرسانی شد.`);
    setAmount("");
  }

  return (
    <form onSubmit={handleSubmit} className="partner-card" style={{ maxWidth: 500, display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <label style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 6 }}>نوع تغییر</label>
        <select className="partner-input" value={adjustType} onChange={(e) => setAdjustType(e.target.value as "percent" | "fixed")}>
          <option value="percent">درصدی</option>
          <option value="fixed">مبلغ ثابت (تومان)</option>
        </select>
      </div>

      <div>
        <label style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 6 }}>جهت تغییر</label>
        <select className="partner-input" value={direction} onChange={(e) => setDirection(e.target.value as "increase" | "decrease")}>
          <option value="increase">افزایش قیمت</option>
          <option value="decrease">کاهش قیمت</option>
        </select>
      </div>

      <div>
        <label style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 6 }}>
          {adjustType === "percent" ? "درصد تغییر" : "مبلغ تغییر (تومان)"}
        </label>
        <input
          type="number"
          className="partner-input"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min={0}
          placeholder={adjustType === "percent" ? "مثلاً 5" : "مثلاً 10000"}
        />
      </div>

      <button type="submit" disabled={loading} className="partner-btn partner-btn-primary">
        {loading ? "در حال اعمال..." : "اعمال تغییر قیمت"}
      </button>
      <p style={{ fontSize: 11, color: "#6b7280" }}>
        این تغییر روی همه‌ی محصولات شما اعمال می‌شود و قیمت فروش و قیمت دریافتی شما هماهنگ تغییر می‌کند.
      </p>
    </form>
  );
}