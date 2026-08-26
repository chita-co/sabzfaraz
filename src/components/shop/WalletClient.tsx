"use client";

import { useState } from "react";
import { Wallet, CreditCard, Landmark, Loader2 } from "lucide-react";
import { submitManualTopupRequest, topUpWalletOnline } from "@/app/(shop)/profile/wallet/actions";;

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
  const [method, setMethod] = useState<"CARD_TO_CARD" | "SHEBA">("CARD_TO_CARD");
  const [bankAccountId, setBankAccountId] = useState(bankAccounts[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payingOnline, setPayingOnline] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<"CARD_TO_CARD" | "SHEBA" | null>(null);

  function validateAmount(): number | null {
    const n = Number(amount);
    if (!n || n < minTopup) { setError(`حداقل مبلغ شارژ ${minTopup.toLocaleString("fa-IR")} تومان است.`); return null; }
    if (maxTopup && n > maxTopup) { setError(`حداکثر مبلغ شارژ ${maxTopup.toLocaleString("fa-IR")} تومان است.`); return null; }
    return n;
  }

  async function handleOnlineTopup() {
    setError(null);
    const n = validateAmount();
    if (!n) return;
    setPayingOnline(true);
    const result = await topUpWalletOnline(n);
    if (result?.error) {
      setError(result.error);
      setPayingOnline(false);
    }
  }

  function handleClickPay(m: "CARD_TO_CARD" | "SHEBA") {
    setError(null);
    if (!validateAmount()) return;
    if (!bankAccountId) { setError("لطفاً یک حساب بانکی انتخاب کنید."); return; }
    setMethod(m);
    setPendingConfirm(m);
  }

  async function handleConfirm() {
    const m = pendingConfirm;
    setPendingConfirm(null);
    if (!m) return;
    setLoading(true);
    setError(null);
    const result = await submitManualTopupRequest(Number(amount), m, bankAccountId);
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
          <div
            className="payment-method-tab active"
            onClick={handleOnlineTopup}
            style={{ cursor: "pointer" }}
          >
            {payingOnline ? "در حال اتصال به درگاه..." : "پرداخت آنلاین"}
          </div>
          {manualTopupEnabled && (
            <div className="payment-method-tab">
              کارت به کارت / شبا
            </div>
          )}
        </div>

        {manualTopupEnabled && (
          <div className="mt-2 space-y-3">
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
                  <p className="bank-account-holder">{b.account_holder_name}</p>
                  <p className="bank-account-number" dir="ltr">{method === "CARD_TO_CARD" ? b.card_number : b.sheba_number}</p>
                </div>
              ))}
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              <button onClick={() => handleClickPay("CARD_TO_CARD")} disabled={loading} className="admin-btn admin-btn-primary justify-center flex items-center gap-2">
                <CreditCard size={15} /> پرداخت با کارت به کارت انجام شد
              </button>
              <button onClick={() => handleClickPay("SHEBA")} disabled={loading} className="admin-btn admin-btn-secondary justify-center flex items-center gap-2">
                <Landmark size={15} /> پرداخت با شبا انجام شد
              </button>
            </div>
          </div>
        )}
      </div>

      {pendingConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center">
            <h3 className="font-bold text-gray-900 mb-3">تأیید پرداخت</h3>
            <p className="text-sm text-gray-600 mb-6">
              آیا مطمئن هستید پرداخت {Number(amount).toLocaleString("fa-IR")} تومانی از طریق {pendingConfirm === "CARD_TO_CARD" ? "کارت به کارت" : "شبا"} انجام شده است؟
            </p>
            <div className="flex gap-3">
              <button onClick={handleConfirm} disabled={loading} className="flex-1 rounded-xl bg-green-600 py-3 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <Loader2 size={16} className="animate-spin" /> : null} بله، پرداخت شد
              </button>
              <button onClick={() => setPendingConfirm(null)} className="flex-1 rounded-xl bg-gray-100 py-3 text-sm font-bold text-gray-700 hover:bg-gray-200">
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

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