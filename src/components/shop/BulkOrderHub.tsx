"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, ShoppingBag } from "lucide-react";

const statusLabels: Record<string, string> = {
  PENDING_REVIEW: "در انتظار بررسی", SUPPLY_POSSIBLE: "قابل تأمین — منتظر پرداخت",
  AWAITING_PAYMENT_CONFIRMATION: "پرداخت در انتظار تأیید", PREPARING: "در حال تهیه",
  COMPLETED: "تکمیل‌شده / ارسال‌شده", NOT_POSSIBLE: "غیرقابل تأمین", CLOSED_UNPAID: "بسته شده — عدم پرداخت",
};
const statusBadge: Record<string, string> = {
  PENDING_REVIEW: "badge badge-warning", SUPPLY_POSSIBLE: "badge badge-info",
  AWAITING_PAYMENT_CONFIRMATION: "badge badge-warning", PREPARING: "badge badge-success",
  COMPLETED: "badge badge-success", NOT_POSSIBLE: "badge badge-danger",
};

interface Request { id: string; request_number: string; status: string; created_at: string; }

export default function BulkOrderHub({ requests }: { requests: Request[] }) {
  const [tab, setTab] = useState<"previous" | "new">(requests.length > 0 ? "previous" : "new");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center gap-2 mb-2">
        <ShoppingBag size={22} className="text-green-400" />
        <h1 className="text-xl font-bold text-white">سفارش جمعی از بازار الکترونیک</h1>
      </div>
      <p className="text-gray-300 text-sm mb-6">ترکیبی از کالاهای فروشگاه و کالاهایی که در سایت نیست رو درخواست بده — ما از بازار برات تهیه می‌کنیم.</p>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab("previous")} className={`order-tab${tab === "previous" ? " active" : ""}`}>سفارش‌های پیشین</button>
        <button onClick={() => setTab("new")} className={`order-tab${tab === "new" ? " active" : ""}`}>سفارش جدید</button>
      </div>

      {tab === "new" ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <p className="text-gray-600 text-sm mb-4">برای ثبت یک درخواست سفارش جمعی جدید، وارد فرم ثبت درخواست شوید.</p>
          <Link href="/bulk-order/new" className="admin-btn admin-btn-primary flex items-center gap-2 justify-center" style={{ display: "inline-flex" }}>
            <Plus size={16} /> ثبت سفارش جمعی جدید
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <Link key={r.id} href={`/bulk-order/${r.id}`} className="support-ticket-row">
              <div className="support-ticket-icon"><ShoppingBag size={18} /></div>
              <div className="flex-1">
                <p className="font-medium text-gray-800" dir="ltr">{r.request_number}</p>
                <p className="text-xs text-gray-500">{new Date(r.created_at).toLocaleDateString("fa-IR")}</p>
              </div>
              <span className={statusBadge[r.status]}>{statusLabels[r.status]}</span>
            </Link>
          ))}
          {requests.length === 0 && (
            <p className="text-gray-300 text-sm text-center py-10">هنوز درخواستی ثبت نکرده‌ای. از تب «سفارش جدید» شروع کن.</p>
          )}
        </div>
      )}
    </div>
  );
}