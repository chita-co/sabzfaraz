"use client";

import { useState } from "react";
import {
  setBulkFinalTotal,
  requestBalanceFromCustomer,
  refundToWallet,
  createRefundRequest,
} from "@/app/admin/bulk-orders/money-actions";

export default function BulkMoneyManager({
  requestId,
  currentTotal,
}: {
  requestId: string;
  currentTotal: number | null;
}) {
  const [finalTotal, setFinalTotal] = useState(currentTotal !== null ? String(currentTotal) : "");

  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceNote, setBalanceNote] = useState("");

  const [refundMethod, setRefundMethod] = useState<"WALLET" | "CARD_TO_CARD" | "SHEBA">("WALLET");
  const [refundAmount, setRefundAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [refundNote, setRefundNote] = useState("");

  const [busy, setBusy] = useState(false);

  const toInt = (v: string) => Number(v.replace(/[,\s٬]/g, ""));

  async function handleSaveTotal() {
    setBusy(true);
    const r = await setBulkFinalTotal(requestId, toInt(finalTotal));
    setBusy(false);
    if (r?.error) alert(r.error);
    else window.location.reload();
  }

  async function handleRequestBalance() {
    setBusy(true);
    const r = await requestBalanceFromCustomer(requestId, toInt(balanceAmount), balanceNote);
    setBusy(false);
    if (r?.error) alert(r.error);
    else window.location.reload();
  }

  async function handleRefund() {
    setBusy(true);
    const r =
      refundMethod === "WALLET"
        ? await refundToWallet(requestId, { amount: toInt(refundAmount), phone, fullName, note: refundNote })
        : await createRefundRequest(requestId, { amount: toInt(refundAmount), method: refundMethod, note: refundNote });
    setBusy(false);
    if (r?.error) alert(r.error);
    else window.location.reload();
  }

  return (
    <div className="mt-5 border-t pt-5 space-y-6">
      <div>
        <label className="block text-sm font-medium mb-1">مبلغ کل نهایی سفارش (تومان)</label>
        <div className="flex gap-2">
          <input
            value={finalTotal}
            onChange={(e) => setFinalTotal(e.target.value)}
            dir="ltr"
            className="flex-1 border rounded px-3 py-2 text-sm"
          />
          <button type="button" disabled={busy} onClick={handleSaveTotal} className="admin-btn admin-btn-primary">
            ثبت مبلغ کل و اطلاع به مشتری
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium">درخواست دریافت مبلغ اضافه از مشتری</p>
        <p className="text-xs text-gray-500">
          مبلغ وارد‌شده به مبلغ کل نهایی اضافه می‌شود و مشتری پیامک و اعلان می‌گیرد و دکمه‌ی پرداخت مانده برایش فعال می‌شود.
        </p>
        <div className="flex flex-wrap gap-2">
          <input
            value={balanceAmount}
            onChange={(e) => setBalanceAmount(e.target.value)}
            placeholder="مبلغ درخواستی (تومان)"
            dir="ltr"
            className="border rounded px-3 py-2 text-sm"
          />
        </div>
        <input
          value={balanceNote}
          onChange={(e) => setBalanceNote(e.target.value)}
          placeholder="توضیح برای مشتری (مثلاً: هزینه‌ی بسته‌بندی یا افزایش قیمت بازار)"
          className="w-full border rounded px-3 py-2 text-sm"
        />
        <button type="button" disabled={busy} onClick={handleRequestBalance} className="admin-btn admin-btn-primary">
          ثبت درخواست و اطلاع به مشتری
        </button>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium">ثبت بازپرداخت به مشتری</p>
        <div className="flex flex-wrap gap-2">
          <select
            value={refundMethod}
            onChange={(e) => setRefundMethod(e.target.value as "WALLET" | "CARD_TO_CARD" | "SHEBA")}
            className="border rounded px-2 py-2 text-sm"
          >
            <option value="WALLET">کیف پول سایت</option>
            <option value="CARD_TO_CARD">کارت به کارت (مشتری شماره کارت می‌دهد)</option>
            <option value="SHEBA">شبا (مشتری شماره شبا می‌دهد)</option>
          </select>
          <input
            value={refundAmount}
            onChange={(e) => setRefundAmount(e.target.value)}
            placeholder="مبلغ (تومان)"
            dir="ltr"
            className="border rounded px-3 py-2 text-sm"
          />
        </div>

        {refundMethod === "WALLET" && (
          <div className="flex flex-wrap gap-2">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="شماره موبایل مشتری"
              dir="ltr"
              className="border rounded px-3 py-2 text-sm"
            />
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="نام و نام خانوادگی مشتری (همان ثبت‌شده)"
              className="border rounded px-3 py-2 text-sm"
            />
          </div>
        )}

        <input
          value={refundNote}
          onChange={(e) => setRefundNote(e.target.value)}
          placeholder="توضیح داخلی (اختیاری)"
          className="w-full border rounded px-3 py-2 text-sm"
        />
        <button type="button" disabled={busy} onClick={handleRefund} className="admin-btn admin-btn-primary">
          {refundMethod === "WALLET" ? "بازپرداخت به کیف پول" : "ارسال درخواست ثبت حساب به مشتری"}
        </button>
      </div>
    </div>
  );
}