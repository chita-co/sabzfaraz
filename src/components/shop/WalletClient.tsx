"use client";

import { useState } from "react";
import { Wallet, CreditCard, Upload, Loader2 } from "lucide-react";
import { topUpWalletOnline, submitManualTopupRequest } from "@/app/(shop)/profile/wallet/actions";

const typeLabels: Record<string, string> = { credit: "شارژ", debit: "برداشت", refund: "بازگشت وجه" };
const statusLabels: Record<string, string> = { PENDING: "در انتظار", APPROVED: "تأیید شده", REJECTED: "رد شده" };

interface Tx { id: string; type: string; amount: number; balance_after: number; description: string | null; status: string; created_at: string; }
interface TopupReq { id: string; amount: number; method: string; status: string; created_at: string; }
interface Bank { id: string; bank_name: string; account_holder_name: string; card_number: string | null; sheba_number: string | null; logo_slug: string; }

export default function WalletClient({
  balance, transactions, pendingRequests, minTopup, maxTopup, manualTopupEnabled, bankAccounts,
}: {
  balance: number; transactions: Tx[]; pendingRequests: TopupReq[]; minTopup: number; maxTopup: number | null;
  manualTopupEnabled: boolean; bankAccounts: Bank[];
}) {
  const [amount, setAmount] = useState(minTopup.toString());
  const [mode, setMode] = useState<"ONLINE" | "MANUAL">("ONLINE");
  const [method, setMethod] = useState<"CARD_TO_CARD" | "SHEBA">("CARD_TO_CARD");
  const [bankAccountId, setBankAccountId] = useState(bankAccounts[0]?.id ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleOnline() {
    setError(null);
    const n = Number(amount);
    if (!n || n < minTopup) { setError(`حداقل مبلغ شارژ ${minTopup.toLocaleString("fa-IR")} تومان است.`); return; }
    if (maxTopup && n > maxTopup) { setError(`حداکثر مبلغ شارژ ${maxTopup.toLocaleString("fa-IR")} تومان است.`); return; }
    setLoading(true);
    await topUpWalletOnline(n);
    setLoading(false);
  }

  async function handleManual() {
    setError(null);
    const n = Number(amount);
    if (!n || n < minTopup) { setError(`حداقل مبلغ شارژ ${minTopup.toLocaleString("fa-IR")} تومان است.`); return; }
    if (!file) { setError("لطفاً تصویر رسید پرداخت را آپلود کنید."); return; }
    if (!bankAccountId) { setError("لطفاً یک حساب بانکی انتخاب کنید."); return; }
    const fd = new FormData();
    fd.append("file", file);
    setLoading(true);
    const result = await submitManualTopupRequest(n, method, bankAccountId, fd);
    setLoading(false);
    if (result?.error) setError(result.error);
    else window.location.reload();
  }

  return (
    <div className="space-y-6">
      <div className="loyalty-hero-card" style={{ borderColor: "#4ade80" }}>
        <div className="flex items-center gap-2 mb-2">
          <Wallet size={22} className="text-green-600" />
          <span className="loyalty-tier-name" style={{ color: "#15803d" }}>موجودی کیف پول</span>
        </div>
        <div className="loyalty-balance-display">{balance.toLocaleString("fa-IR")} <small>تومان</small></div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-bold text-gray-800 mb-4">شارژ کیف پول</h2>
        <div className="admin-form-group">
          <label>مبلغ (تومان)</label>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="admin-input" min={minTopup} />
        </div>

        <div className="payment-method-tabs">
          <div className={`payment-method-tab${mode === "ONLINE" ? " active" : ""}`} onClick={() => setMode("ONLINE")}>پرداخت آنلاین</div>
          {manualTopupEnabled && (
            <div className={`payment-method-tab${mode === "MANUAL" ? " active" : ""}`} onClick={() => setMode("MANUAL")}>کارت به کارت / شبا</div>
          )}
        </div>

        {mode === "MANUAL" && (
          <div className="mt-4 space-y-3">
            <div className="flex gap-2">
              <button type="button" onClick={() => setMethod("CARD_TO_CARD")} className={`admin-btn ${method === "CARD_TO_CARD" ? "admin-btn-primary" : "admin-btn-secondary"}`}>کارت به کارت</button>
              <button type="button" onClick={() => setMethod("SHEBA")} className={`admin-btn ${method === "SHEBA" ? "admin-btn-primary" : "admin-btn-secondary"}`}>شبا</button>
            </div>
            <div className="bank-accounts-row">
              {bankAccounts.map((b) => (
                <div key={b.id} className={`bank-account-card clickable${bankAccountId === b.id ? " selected" : ""}`} onClick={() => setBankAccountId(b.id)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={b.logo_slug === "generic" ? "/banks/generic.svg" : `/banks/${b.logo_slug}.png`} alt={b.bank_name} className="bank-account-logo" />
                  <p className="bank-account-name">{b.bank_name}</p>
                  <p className="bank-account-number" dir="ltr">{method === "CARD_TO_CARD" ? b.card_number : b.sheba_number}</p>
                </div>
              ))}
            </div>
            <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg py-3 cursor-pointer text-sm text-gray-500 hover:border-green-500">
              <Upload size={16} /> {file ? file.name : "آپلود تصویر رسید پرداخت"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </label>
          </div>
        )}

        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}

        <button
          onClick={mode === "ONLINE" ? handleOnline : handleManual}
          disabled={loading}
          className="admin-btn admin-btn-primary w-full mt-4 justify-center"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
          {loading ? "در حال پردازش..." : "ثبت درخواست شارژ"}
        </button>
      </div>

      {pendingRequests.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-bold text-gray-800 mb-3">درخواست‌های شارژ اخیر</h2>
          <table className="admin-table">
            <thead><tr><th>مبلغ</th><th>روش</th><th>وضعیت</th><th>تاریخ</th></tr></thead>
            <tbody>
              {pendingRequests.map((r) => (
                <tr key={r.id}>
                  <td>{r.amount.toLocaleString("fa-IR")} تومان</td>
                  <td>{r.method === "ONLINE" ? "آنلاین" : r.method === "CARD_TO_CARD" ? "کارت به کارت" : "شبا"}</td>
                  <td><span className={`badge ${r.status === "APPROVED" ? "badge-success" : r.status === "REJECTED" ? "badge-danger" : "badge-warning"}`}>{statusLabels[r.status]}</span></td>
                  <td className="text-xs text-gray-500">{new Date(r.created_at).toLocaleDateString("fa-IR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-bold text-gray-800 mb-3">تاریخچه تراکنش‌ها</h2>
        <table className="admin-table">
          <thead><tr><th>نوع</th><th>مبلغ</th><th>مانده پس از تراکنش</th><th>شرح</th><th>تاریخ</th></tr></thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id}>
                <td>{typeLabels[t.type] ?? t.type}</td>
                <td className={t.amount >= 0 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                  {t.amount >= 0 ? "+" : ""}{t.amount.toLocaleString("fa-IR")}
                </td>
                <td>{t.balance_after.toLocaleString("fa-IR")}</td>
                <td className="text-xs text-gray-500">{t.description}</td>
                <td className="text-xs text-gray-500">{new Date(t.created_at).toLocaleDateString("fa-IR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {transactions.length === 0 && <p className="text-gray-500 text-sm text-center py-6">هنوز تراکنشی ثبت نشده.</p>}
      </div>
    </div>
  );
}