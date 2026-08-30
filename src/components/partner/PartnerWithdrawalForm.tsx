"use client";
import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { requestWithdrawalAction } from "@/app/partner/wallet/actions";

export default function PartnerWithdrawalForm({
  availableBalance, minWithdrawal, shebaNumber, cardNumber,
}: { availableBalance: number; minWithdrawal: number; shebaNumber: string; cardNumber: string }) {
  const [amount, setAmount] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit() {
    const value = Number(amount);
    if (!value) return toast.error("مبلغ را وارد کنید.");
    startTransition(async () => {
      const res = await requestWithdrawalAction(value);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("درخواست برداشت ثبت شد.");
      setAmount("");
    });
  }

  return (
    <div className="partner-card">
      <h2 style={{ fontWeight: 700, marginBottom: 10 }}>درخواست برداشت</h2>
      <p style={{ fontSize: 11.5, color: "#9ca3af", marginBottom: 8 }}>واریز به: {shebaNumber || cardNumber || "هنوز ثبت نشده"}</p>
      <div style={{ display: "flex", gap: 8 }}>
        <input className="partner-input" type="number" placeholder={`حداقل ${minWithdrawal.toLocaleString("fa-IR")} تومان`} value={amount} onChange={(e) => setAmount(e.target.value)} />
        <button onClick={submit} disabled={isPending} className="partner-btn partner-btn-primary">{isPending ? "..." : "ثبت درخواست"}</button>
      </div>
      <p style={{ fontSize: 11, color: "#6b7280", marginTop: 6 }}>موجودی قابل برداشت: {availableBalance.toLocaleString("fa-IR")} تومان</p>
    </div>
  );
}