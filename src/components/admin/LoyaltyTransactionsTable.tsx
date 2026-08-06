"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Minus } from "lucide-react";
import { adjustUserPoints } from "@/app/admin/loyalty/actions";

const typeLabels: Record<string, string> = {
  EARNED: "کسب‌شده", REDEEMED: "مصرف‌شده", REFUNDED: "بازگشتی",
  EXPIRED: "منقضی‌شده", BONUS: "پاداش", ADJUSTMENT: "اصلاح دستی",
};
const typeColors: Record<string, string> = {
  EARNED: "badge-success", REDEEMED: "badge-info", REFUNDED: "badge-info",
  EXPIRED: "badge-danger", BONUS: "badge-warning", ADJUSTMENT: "badge-warning",
};

interface Tx {
  id: string; type: string; points: number; balance_after: number; description: string | null;
  created_at: string; profile: { full_name: string | null; phone: string | null } | null; user_id: string;
}

export default function LoyaltyTransactionsTable({ transactions, initialQuery }: { transactions: Tx[]; initialQuery: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);
  const [adjustUserId, setAdjustUserId] = useState<string | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustDesc, setAdjustDesc] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/admin/loyalty/transactions?q=${encodeURIComponent(q)}`);
  }

  async function handleAdjust() {
    if (!adjustUserId || !adjustAmount) return;
    await adjustUserPoints(adjustUserId, Number(adjustAmount), adjustDesc);
    window.location.reload();
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-5">دفتر کل تراکنش‌های امتیازی</h1>

      <form onSubmit={handleSearch} className="admin-filters-search mb-4" style={{ maxWidth: 320 }}>
        <Search size={15} />
        <input type="text" placeholder="جستجو بر اساس نام یا موبایل..." value={q} onChange={(e) => setQ(e.target.value)} />
        <button type="submit" className="admin-filters-apply-btn">اعمال</button>
      </form>

      <div className="admin-card">
        <table className="admin-table">
          <thead><tr><th>کاربر</th><th>نوع</th><th>مقدار</th><th>موجودی بعد</th><th>توضیح</th><th>تاریخ</th><th></th></tr></thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id}>
                <td>{t.profile?.full_name ?? "—"}</td>
                <td><span className={`badge ${typeColors[t.type]}`}>{typeLabels[t.type]}</span></td>
                <td className={t.points >= 0 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                  {t.points >= 0 ? "+" : ""}{t.points.toLocaleString("fa-IR")}
                </td>
                <td>{t.balance_after.toLocaleString("fa-IR")}</td>
                <td className="text-xs text-gray-500">{t.description}</td>
                <td className="text-xs text-gray-500">{new Date(t.created_at).toLocaleString("fa-IR")}</td>
                <td>
                  <button onClick={() => setAdjustUserId(t.user_id)} className="admin-btn admin-btn-secondary">
                    اصلاح دستی
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {transactions.length === 0 && <p className="text-gray-500 text-sm text-center py-6">تراکنشی یافت نشد.</p>}
      </div>

      {adjustUserId && (
        <div className="admin-modal-overlay" onClick={() => setAdjustUserId(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-bold text-gray-900 mb-4">اصلاح دستی امتیاز کاربر</h2>
            <div className="admin-form-group">
              <label>مقدار (مثبت برای افزودن، منفی برای کسر)</label>
              <input type="number" value={adjustAmount} onChange={(e) => setAdjustAmount(e.target.value)} placeholder="مثلاً: 500 یا -200" />
            </div>
            <div className="admin-form-group">
              <label>توضیح</label>
              <input type="text" value={adjustDesc} onChange={(e) => setAdjustDesc(e.target.value)} placeholder="دلیل اصلاح" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleAdjust} className="admin-btn admin-btn-primary flex items-center gap-1">
                {Number(adjustAmount) >= 0 ? <Plus size={14} /> : <Minus size={14} />} اعمال
              </button>
              <button onClick={() => setAdjustUserId(null)} className="admin-btn admin-btn-secondary">انصراف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}