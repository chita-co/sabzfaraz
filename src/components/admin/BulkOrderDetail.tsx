"use client";

import { useState } from "react";
import { updateBulkOrderStatus } from "@/app/admin/bulk-orders/actions";

interface ItemRow { name: string; quantity: number; estimatedPrice: number; description: string; }

interface BulkOrderRequest {
  id: string;
  request_number: string;
  profile?: {
    full_name?: string;
    phone?: string;
  } | null;
  items: ItemRow[];
  subtotal_estimated: number;
  service_fee_amount: number;
  shipping_cost: number;
  total_estimated: number;
  payment_method: string;
  bank_account?: {
    bank_name?: string;
  } | null;
  admin_note?: string | null;
}

export default function BulkOrderDetail({ request }: { request: BulkOrderRequest }) {
  const [note, setNote] = useState(request.admin_note ?? "");
  const [saving, setSaving] = useState(false);

  async function handleStatus(status: string) {
    setSaving(true);
    await updateBulkOrderStatus(request.id, status, note);
    setSaving(false);
    window.location.reload();
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-1">سفارش جمعی {request.request_number}</h1>
      <p className="text-sm text-gray-500 mb-5">مشتری: {request.profile?.full_name} — {request.profile?.phone}</p>

      <div className="admin-card mb-5">
        <h2 className="font-bold text-gray-800 mb-3">اقلام درخواستی</h2>
        <table className="admin-table">
          <thead><tr><th>نام کالا</th><th>تعداد</th><th>قیمت تقریبی</th><th>توضیحات</th></tr></thead>
          <tbody>
            {(request.items as ItemRow[]).map((it, i) => (
              <tr key={i}>
                <td>{it.name}</td>
                <td>{it.quantity.toLocaleString("fa-IR")}</td>
                <td>{(it.estimatedPrice || 0).toLocaleString("fa-IR")} تومان</td>
                <td className="text-xs text-gray-500">{it.description || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-card mb-5">
        <p className="text-sm">جمع کالاها: {request.subtotal_estimated.toLocaleString("fa-IR")} تومان</p>
        <p className="text-sm">کارمزد خدمات: {request.service_fee_amount.toLocaleString("fa-IR")} تومان</p>
        <p className="text-sm">هزینه ارسال: {request.shipping_cost.toLocaleString("fa-IR")} تومان</p>
        <p className="text-sm font-bold mt-2">مبلغ نهایی: {request.total_estimated.toLocaleString("fa-IR")} تومان</p>
        <p className="text-xs text-gray-500 mt-3">روش پرداخت: {request.payment_method === "CARD_TO_CARD" ? "کارت به کارت" : "شبا"} — {request.bank_account?.bank_name}</p>
      </div>

      <div className="admin-card">
        <div className="admin-form-group">
          <label>یادداشت ادمین (مثلاً تاریخ واریز، کد پیگیری بانکی)</label>
          <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => handleStatus("PAYMENT_CONFIRMED")} disabled={saving} className="admin-btn admin-btn-primary">تأیید پرداخت</button>
          <button onClick={() => handleStatus("COMPLETED")} disabled={saving} className="admin-btn admin-btn-secondary">علامت‌گذاری تکمیل‌شده</button>
          <button onClick={() => handleStatus("REJECTED")} disabled={saving} className="admin-btn admin-btn-danger">رد سفارش</button>
        </div>
      </div>
    </div>
  );
}