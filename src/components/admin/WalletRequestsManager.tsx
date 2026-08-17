"use client";

import { useState } from "react";
import { Check, X, AlertTriangle } from "lucide-react";
import { approveTopupRequest, rejectTopupRequest } from "@/app/admin/wallet-requests/actions";

interface Req {
  id: string; amount: number; method: string; status: string; receipt_image_url: string | null; created_at: string;
  profile: { full_name: string | null; phone: string | null } | null;
  bank_account: { bank_name: string } | null;
}

export default function WalletRequestsManager({ requests, totalWallets }: { requests: Req[]; totalWallets: number }) {
  const [rows, setRows] = useState(requests);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  async function handleApprove(id: string) {
    if (!confirm("آیا از تأیید این درخواست شارژ مطمئن هستید؟")) return;
    const result = await approveTopupRequest(id);
    if (result?.error) alert(result.error);
    else setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: "APPROVED" } : r)));
  }

  async function handleReject() {
    if (!rejectingId || !reason.trim()) return;
    const result = await rejectTopupRequest(rejectingId, reason.trim());
    if (result?.error) alert(result.error);
    else setRows((prev) => prev.map((r) => (r.id === rejectingId ? { ...r, status: "REJECTED" } : r)));
    setRejectingId(null);
    setReason("");
  }

  const pending = rows.filter((r) => r.status === "PENDING");

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">درخواست‌های شارژ کیف پول</h1>
      <p className="text-sm text-gray-500 mb-5">مجموع موجودی کیف پول همه کاربران: <b>{totalWallets.toLocaleString("fa-IR")} تومان</b></p>

      {pending.length > 0 && (
        <div
          style={{
            background: "#fee2e2", border: "1.5px solid #fca5a5", color: "#991b1b",
            borderRadius: 14, padding: "14px 18px", marginBottom: 20,
            display: "flex", alignItems: "center", gap: 10, fontWeight: 700, fontSize: 13.5,
          }}
        >
          <AlertTriangle size={20} />
          {pending.length.toLocaleString("fa-IR")} درخواست شارژ کیف پول در انتظار بررسی شماست — لطفاً هرچه سریع‌تر بررسی کنید.
        </div>
      )}

      <div className="admin-card">
        <table className="admin-table">
          <thead><tr><th>کاربر</th><th>مبلغ</th><th>روش</th><th>رسید</th><th>وضعیت</th><th>تاریخ و ساعت</th><th></th></tr></thead>
          <tbody>
            {pending.map((r) => (
              <tr key={r.id}>
                <td>{r.profile?.full_name ?? "—"} <span className="text-xs text-gray-400">{r.profile?.phone}</span></td>
                <td>{r.amount.toLocaleString("fa-IR")} تومان</td>
                <td>{r.method === "ONLINE" ? "آنلاین" : r.bank_account?.bank_name ?? "—"}</td>
                <td>{r.receipt_image_url ? <a href={r.receipt_image_url} target="_blank" rel="noreferrer" className="text-green-600 underline text-xs">مشاهده رسید</a> : "—"}</td>
                <td><span className="badge badge-warning">در انتظار بررسی</span></td>
                <td className="text-xs text-gray-500">{new Date(r.created_at).toLocaleString("fa-IR")}</td>
                <td>
                  <div className="flex gap-1">
                    <button onClick={() => handleApprove(r.id)} className="admin-btn admin-btn-primary"><Check size={13} /></button>
                    <button onClick={() => setRejectingId(r.id)} className="admin-btn admin-btn-danger"><X size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pending.length === 0 && <p className="text-gray-500 text-sm text-center py-6">درخواست در انتظاری وجود ندارد.</p>}
      </div>

      {rejectingId && (
        <div className="admin-modal-overlay" onClick={() => setRejectingId(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-bold text-gray-900 mb-4">دلیل رد درخواست</h2>
            <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} className="admin-input w-full mb-4" />
            <div className="flex gap-2">
              <button onClick={handleReject} className="admin-btn admin-btn-danger flex-1">تأیید رد</button>
              <button onClick={() => setRejectingId(null)} className="admin-btn admin-btn-secondary flex-1">انصراف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}