"use client";

import { useState } from "react";
import { ArrowDownCircle } from "lucide-react";
import { createPlatformWithdrawal } from "@/app/admin/finance/wallet-withdrawals/actions";

interface Withdrawal { id: string; amount: number; note: string | null; created_at: string; bank_account: { bank_name: string; account_holder_name: string } | null; }
interface Bank { id: string; bank_name: string; account_holder_name: string; }

export default function WalletWithdrawalManager({
  withdrawals, bankAccounts, totalWallets, totalWithdrawn,
}: { withdrawals: Withdrawal[]; bankAccounts: Bank[]; totalWallets: number; totalWithdrawn: number }) {
  const [rows, setRows] = useState(withdrawals);
  const [amount, setAmount] = useState("");
  const [bankAccountId, setBankAccountId] = useState(bankAccounts[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    const n = Number(amount);
    if (!n || n <= 0) { setError("مبلغ نامعتبر است."); return; }
    if (!bankAccountId) { setError("یک حساب بانکی انتخاب کنید."); return; }
    setSaving(true);
    const result = await createPlatformWithdrawal(n, bankAccountId, note);
    setSaving(false);
    if (result?.error) { setError(result.error); return; }
    setRows((prev) => [{ id: Date.now().toString(), amount: n, note, created_at: new Date().toISOString(), bank_account: bankAccounts.find((b) => b.id === bankAccountId) ?? null }, ...prev]);
    setAmount(""); setNote("");
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <ArrowDownCircle size={20} className="text-amber-500" />
        <h1 className="text-xl font-bold text-gray-900">برداشت و تسویه کیف پول</h1>
      </div>
      <p className="text-sm text-gray-500 mb-5">
        مجموع موجودی فعلی همه کیف‌پول‌ها: <b>{totalWallets.toLocaleString("fa-IR")} تومان</b> — مجموع برداشت‌های ثبت‌شده: <b>{totalWithdrawn.toLocaleString("fa-IR")} تومان</b>
      </p>
      <p className="text-xs text-gray-400 mb-5">
        توجه: مبالغ شارژ آنلاین و کارت‌به‌کارت مستقیماً به حساب بانکی فروشگاه واریز می‌شود. این بخش صرفاً برای ثبت رسمی و حسابداری برداشت/تسویه است.
      </p>

      <div className="admin-card mb-5">
        <h2 className="font-bold text-gray-800 mb-3">ثبت برداشت جدید</h2>
        <div className="grid md:grid-cols-3 gap-3">
          <div className="admin-form-group"><label>مبلغ (تومان)</label><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="admin-input" /></div>
          <div className="admin-form-group">
            <label>حساب بانکی مقصد</label>
            <select value={bankAccountId} onChange={(e) => setBankAccountId(e.target.value)} className="admin-input">
              {bankAccounts.map((b) => <option key={b.id} value={b.id}>{b.bank_name} — {b.account_holder_name}</option>)}
            </select>
          </div>
          <div className="admin-form-group"><label>توضیحات</label><input type="text" value={note} onChange={(e) => setNote(e.target.value)} className="admin-input" /></div>
        </div>
        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
        <button onClick={handleSubmit} disabled={saving} className="admin-btn admin-btn-primary">{saving ? "در حال ثبت..." : "ثبت برداشت"}</button>
      </div>

      <div className="admin-card">
        <h2 className="font-bold text-gray-800 mb-3">تاریخچه برداشت‌ها</h2>
        <table className="admin-table">
          <thead><tr><th>مبلغ</th><th>حساب مقصد</th><th>توضیحات</th><th>تاریخ</th></tr></thead>
          <tbody>
            {rows.map((w) => (
              <tr key={w.id}>
                <td>{w.amount.toLocaleString("fa-IR")} تومان</td>
                <td>{w.bank_account?.bank_name ?? "—"}</td>
                <td className="text-xs text-gray-500">{w.note}</td>
                <td className="text-xs text-gray-500">{new Date(w.created_at).toLocaleDateString("fa-IR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="text-gray-500 text-sm text-center py-6">هنوز برداشتی ثبت نشده.</p>}
      </div>
    </div>
  );
}