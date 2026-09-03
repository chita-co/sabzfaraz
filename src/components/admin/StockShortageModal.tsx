"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { X } from "lucide-react";
import { reportStockShortageAction } from "@/app/admin/partners/orders/actions";

export default function StockShortageModal({ item, onClose }: { item: { id: string; product_name: string; price: number; quantity: number }; onClose: () => void }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [applyPenalty, setApplyPenalty] = useState(true);
  const [penaltyAmount, setPenaltyAmount] = useState("");
  const [refundCustomer, setRefundCustomer] = useState(true);
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!reason.trim()) return toast.error("علت عدم تامین را بنویسید.");
    setSaving(true);
    const res = await reportStockShortageAction(item.id, reason.trim(), applyPenalty, Number(penaltyAmount) || 0, refundCustomer);
    setSaving(false);
    if (res.error) return toast.error(res.error);
    toast.success("عدم تامین ثبت شد.");
    onClose();
    router.refresh();
  }

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h2 style={{ fontWeight: 800, fontSize: 15 }}>ثبت عدم تامین — {item.product_name}</h2>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="admin-form-group">
          <label>علت عدم تامین</label>
          <textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="مثلاً: موجودی همکار تمام شده بود" />
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 10 }}>
          <input type="checkbox" checked={applyPenalty} onChange={(e) => setApplyPenalty(e.target.checked)} /> جریمه به همکار اعمال شود
        </label>
        {applyPenalty && (
          <div className="admin-form-group">
            <label>مبلغ جریمه (تومان)</label>
            <input type="number" value={penaltyAmount} onChange={(e) => setPenaltyAmount(e.target.value)} />
          </div>
        )}
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 14 }}>
          <input type="checkbox" checked={refundCustomer} onChange={(e) => setRefundCustomer(e.target.checked)} /> مبلغ {(item.price * item.quantity).toLocaleString("fa-IR")} تومان به کیف پول مشتری بازگردانده شود
        </label>
        <button onClick={handleSubmit} disabled={saving} className="admin-btn admin-btn-danger" style={{ width: "100%" }}>{saving ? "در حال ثبت..." : "ثبت عدم تامین"}</button>
      </div>
    </div>
  );
}