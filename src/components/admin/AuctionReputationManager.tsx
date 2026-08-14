"use client";

import { useState } from "react";
import { ShieldCheck, ShieldAlert, Plus, Minus } from "lucide-react";
import { unblacklistUser, adjustReputationScore } from "@/app/admin/auction-reputation/actions";
import { getReputationTier } from "@/lib/auction/reputation";

interface UserRow {
  id: string; full_name: string | null; phone: string | null;
  auction_reputation_score: number; auction_payment_failures: number; is_auction_blacklisted: boolean;
}

export default function AuctionReputationManager({ users }: { users: UserRow[] }) {
  const [rows, setRows] = useState(users);

  async function handleUnblock(id: string) {
    if (!confirm("آیا از رفع محدودیت این کاربر مطمئن هستید؟")) return;
    const result = await unblacklistUser(id);
    if (result?.error) alert(result.error);
    else setRows((prev) => prev.map((u) => (u.id === id ? { ...u, is_auction_blacklisted: false, auction_payment_failures: 0 } : u)));
  }

  async function handleAdjust(id: string, delta: number) {
    const result = await adjustReputationScore(id, delta);
    if (result?.error) alert(result.error);
    else setRows((prev) => prev.map((u) => (u.id === id ? { ...u, auction_reputation_score: Math.max(0, Math.min(300, u.auction_reputation_score + delta)) } : u)));
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        <ShieldAlert size={20} className="text-amber-500" />
        <h1 className="text-xl font-bold text-gray-900">اعتبار و لیست سیاه شرکت‌کنندگان مزایده</h1>
      </div>
      <p className="text-sm text-gray-500 mb-5">این لیست فقط کاربرانی را نشان می‌دهد که امتیازشان از مقدار پیش‌فرض تغییر کرده یا سابقه عدم پرداخت دارند.</p>

      <div className="admin-card">
        <table className="admin-table">
          <thead><tr><th>کاربر</th><th>امتیاز اعتبار</th><th>رتبه</th><th>دفعات عدم پرداخت</th><th>وضعیت</th><th></th></tr></thead>
          <tbody>
            {rows.map((u) => {
              const tier = getReputationTier(u.auction_reputation_score);
              return (
                <tr key={u.id}>
                  <td>{u.full_name ?? "—"} <span className="text-xs text-gray-400" dir="ltr">{u.phone}</span></td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleAdjust(u.id, -10)} className="admin-btn admin-btn-secondary" style={{ padding: "4px 8px" }}><Minus size={11} /></button>
                      <b>{u.auction_reputation_score.toLocaleString("fa-IR")}</b>
                      <button onClick={() => handleAdjust(u.id, 10)} className="admin-btn admin-btn-secondary" style={{ padding: "4px 8px" }}><Plus size={11} /></button>
                    </div>
                  </td>
                  <td><span className="badge" style={{ background: tier.color + "22", color: tier.color }}>{tier.label}</span></td>
                  <td>{u.auction_payment_failures.toLocaleString("fa-IR")}</td>
                  <td>{u.is_auction_blacklisted ? <span className="badge badge-danger">مسدود</span> : <span className="badge badge-success">عادی</span>}</td>
                  <td>{u.is_auction_blacklisted && <button onClick={() => handleUnblock(u.id)} className="admin-btn admin-btn-primary flex items-center gap-1"><ShieldCheck size={12} /> رفع مسدودی</button>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && <p className="text-gray-500 text-sm text-center py-6">در حال حاضر کاربری با سابقه خاص وجود ندارد.</p>}
      </div>
    </div>
  );
}