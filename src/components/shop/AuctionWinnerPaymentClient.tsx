"use client";

import { useState } from "react";
import { Trophy, Clock, MapPin, Upload, Loader2, CheckCircle2 } from "lucide-react";
import { createAuctionWinnerOrderOnline, createAuctionWinnerOrderOffline } from "@/app/(shop)/auctions/winner-payment-actions";

interface AuctionRow {
  id: string; title: string; images: string[]; winner_bid_amount: number | null; shipping_cost: number;
  winner_payment_deadline: string | null; winner_payment_status: string | null;
}
interface Address {
  id: string;
  full_name: string;
  phone: string;
  province: string;
  city: string;
  postal_code: string;
  address_line: string;
  is_default: boolean;
}
interface Bank { id: string; bank_name: string; account_holder_name: string; card_number: string | null; sheba_number: string | null; logo_slug: string; }

export default function AuctionWinnerPaymentClient({
  auction, addresses, bankAccounts, alreadySubmitted, paymentResult,
}: {
  auction: AuctionRow; addresses: Address[]; bankAccounts: Bank[]; alreadySubmitted: boolean; paymentResult: string | null;
}) {
  const [addressId, setAddressId] = useState(addresses.find((a) => a.is_default)?.id ?? addresses[0]?.id ?? "");
  const [mode, setMode] = useState<"ONLINE" | "MANUAL">("ONLINE");
  const [method, setMethod] = useState<"CARD_TO_CARD" | "SHEBA">("CARD_TO_CARD");
  const [bankAccountId, setBankAccountId] = useState(bankAccounts[0]?.id ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = (auction.winner_bid_amount ?? 0) + (auction.shipping_cost ?? 0);

  async function handlePay() {
    setError(null);
    if (!addressId) { setError("لطفاً یک آدرس ارسال انتخاب کنید."); return; }
    setLoading(true);
    if (mode === "ONLINE") {
      await createAuctionWinnerOrderOnline(auction.id, addressId);
      setLoading(false);
    } else {
      if (!file) { setError("لطفاً تصویر رسید پرداخت را آپلود کنید."); setLoading(false); return; }
      if (!bankAccountId) { setError("لطفاً یک حساب بانکی انتخاب کنید."); setLoading(false); return; }
      const fd = new FormData();
      fd.append("file", file);
      const result = await createAuctionWinnerOrderOffline(auction.id, addressId, method, bankAccountId, fd);
      setLoading(false);
      if (result?.error) setError(result.error);
    }
  }

  if (alreadySubmitted) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
        <CheckCircle2 size={40} className="text-green-500 mx-auto mb-3" />
        <h2 className="font-bold text-gray-800 mb-2">
          {paymentResult === "success" || auction.winner_payment_status === "PAID"
            ? "پرداخت شما با موفقیت ثبت شد"
            : "درخواست پرداخت شما ثبت شد"}
        </h2>
        <p className="text-sm text-gray-500">
          {auction.winner_payment_status === "PAID"
            ? "سفارش شما در حال پردازش است و طبق روال فروشگاه ارسال خواهد شد."
            : "پس از بررسی و تأیید رسید پرداخت توسط تیم ما، سفارش شما ثبت نهایی می‌شود."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="loyalty-hero-card" style={{ borderColor: "#f59e0b" }}>
        <div className="flex items-center gap-2 mb-3">
          <Trophy size={22} className="text-amber-500" />
          <span className="loyalty-tier-name" style={{ color: "#b45309" }}>🎉 شما برنده‌ی این مزایده شدید</span>
        </div>
        <p className="text-sm text-gray-700 mb-1">{auction.title}</p>
        <div className="loyalty-balance-display" style={{ fontSize: 26 }}>
          {total.toLocaleString("fa-IR")} <small>تومان</small>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          (مبلغ پیشنهادی: {(auction.winner_bid_amount ?? 0).toLocaleString("fa-IR")} + هزینه ارسال: {auction.shipping_cost.toLocaleString("fa-IR")})
        </p>
        {auction.winner_payment_deadline && (
          <p className="text-xs text-red-600 flex items-center gap-1 mt-3">
            <Clock size={13} /> مهلت پرداخت تا: {new Date(auction.winner_payment_deadline).toLocaleString("fa-IR")}
          </p>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><MapPin size={16} /> آدرس ارسال</h2>
        {addresses.length === 0 ? (
          <p className="text-sm text-red-600">شما هنوز آدرسی ثبت نکرده‌اید. لطفاً ابتدا از پروفایل خود یک آدرس اضافه کنید.</p>
        ) : (
          <div className="space-y-2">
  {addresses.map((a) => (
    <label key={a.id} className="flex items-start gap-2 border rounded-lg p-3 cursor-pointer" style={{ borderColor: addressId === a.id ? "#16a34a" : "#e5e7eb" }}>
      <input type="radio" name="address" checked={addressId === a.id} onChange={() => setAddressId(a.id)} className="mt-1" />
      <div>
        <p className="text-sm font-medium text-gray-800">{a.full_name}</p>
        <p className="text-xs text-gray-500">{a.province}، {a.city} — {a.address_line}</p>
        <p className="text-xs text-gray-400" dir="ltr">{a.phone}</p>
      </div>
    </label>
  ))}
</div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-bold text-gray-800 mb-3">روش پرداخت</h2>
        <div className="payment-method-tabs">
          <div className={`payment-method-tab${mode === "ONLINE" ? " active" : ""}`} onClick={() => setMode("ONLINE")}>پرداخت آنلاین</div>
          <div className={`payment-method-tab${mode === "MANUAL" ? " active" : ""}`} onClick={() => setMode("MANUAL")}>کارت به کارت / شبا</div>
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

        <button onClick={handlePay} disabled={loading || addresses.length === 0} className="admin-btn admin-btn-primary w-full mt-4 justify-center">
          {loading ? <Loader2 size={16} className="animate-spin" /> : null}
          {loading ? "در حال پردازش..." : `پرداخت ${total.toLocaleString("fa-IR")} تومان`}
        </button>
      </div>
    </div>
  );
}