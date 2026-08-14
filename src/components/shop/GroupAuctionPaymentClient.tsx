"use client";

import { useState } from "react";
import { Users2, MapPin, CheckCircle2, Loader2 } from "lucide-react";
import { setGroupDeliveryAddress, payMyGroupShare } from "@/app/(shop)/auctions/group-actions";

interface Address { id: string; fullName: string; phone: string; province: string; city: string; addressLine: string; isDefault: boolean; }
interface Member { userId: string; name: string; pledgeAmount: number; share: number; paymentStatus: "PENDING" | "PAID"; }

export default function GroupAuctionPaymentClient({
  group, auctionTitle, totalAmount, isLeader, myUserId, addresses, members,
}: {
  group: { id: string; name: string; status: string; deliveryAddressId: string | null };
  auctionTitle: string; totalAmount: number; isLeader: boolean; myUserId: string;
  addresses: Address[]; members: Member[];
}) {
  const [addressId, setAddressId] = useState(group.deliveryAddressId ?? addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? "");
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressSaved, setAddressSaved] = useState(!!group.deliveryAddressId);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const me = members.find((m) => m.userId === myUserId);
  const allPaid = members.every((m) => m.paymentStatus === "PAID");

  async function handleSaveAddress() {
    setError(null);
    if (!addressId) { setError("لطفاً یک آدرس انتخاب کنید."); return; }
    setSavingAddress(true);
    const result = await setGroupDeliveryAddress(group.id, addressId);
    setSavingAddress(false);
    if (result?.error) { setError(result.error); return; }
    setAddressSaved(true);
  }

  async function handlePay() {
    setError(null);
    if (!addressSaved) { setError("سرگروه باید ابتدا آدرس ارسال را ثبت کند."); return; }
    if (!confirm(`آیا از پرداخت سهم خود (${(me?.share ?? 0).toLocaleString("fa-IR")} تومان) از کیف پول مطمئن هستید؟`)) return;
    setPaying(true);
    const result = await payMyGroupShare(group.id);
    setPaying(false);
    if (result?.error) { setError(result.error); return; }
    if (result?.complete) {
      setDone(true);
      setOrderId(result.orderId ?? null);
    } else {
      window.location.reload();
    }
  }

  if (done || group.status === "PAID") {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
        <CheckCircle2 size={40} className="text-green-500 mx-auto mb-3" />
        <h2 className="font-bold text-gray-800 mb-2">خرید گروهی با موفقیت نهایی شد</h2>
        <p className="text-sm text-gray-500">سفارش شما ثبت شد و طبق روال فروشگاه پردازش و ارسال می‌شود.</p>
        {orderId && <a href={`/order/${orderId}`} className="inline-block mt-4 text-green-600 underline text-sm">مشاهده سفارش</a>}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="loyalty-hero-card" style={{ borderColor: "#3b82f6" }}>
        <div className="flex items-center gap-2 mb-3">
          <Users2 size={22} className="text-blue-500" />
          <span className="loyalty-tier-name" style={{ color: "#1d4ed8" }}>🎉 گروه «{group.name}» برنده این مزایده شد</span>
        </div>
        <p className="text-sm text-gray-700 mb-1">{auctionTitle}</p>
        <div className="loyalty-balance-display" style={{ fontSize: 26 }}>{totalAmount.toLocaleString("fa-IR")} <small>تومان</small></div>
        {me && <p className="text-xs text-gray-500 mt-1">سهم شما: <b>{me.share.toLocaleString("fa-IR")} تومان</b> {me.paymentStatus === "PAID" ? "(پرداخت‌شده)" : "(پرداخت‌نشده)"}</p>}
      </div>

      {isLeader && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><MapPin size={16} /> آدرس ارسال (فقط سرگروه)</h2>
          {addressSaved ? (
            <p className="text-sm text-green-600">آدرس ارسال ثبت شد.</p>
          ) : addresses.length === 0 ? (
            <p className="text-sm text-red-600">شما هنوز آدرسی ثبت نکرده‌اید. لطفاً ابتدا از پروفایل خود یک آدرس اضافه کنید.</p>
          ) : (
            <>
              <div className="space-y-2 mb-3">
                {addresses.map((a) => (
                  <label key={a.id} className="flex items-start gap-2 border rounded-lg p-3 cursor-pointer" style={{ borderColor: addressId === a.id ? "#16a34a" : "#e5e7eb" }}>
                    <input type="radio" name="address" checked={addressId === a.id} onChange={() => setAddressId(a.id)} className="mt-1" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{a.fullName}</p>
                      <p className="text-xs text-gray-500">{a.province}، {a.city} — {a.addressLine}</p>
                    </div>
                  </label>
                ))}
              </div>
              <button onClick={handleSaveAddress} disabled={savingAddress} className="admin-btn admin-btn-primary">{savingAddress ? "..." : "ثبت آدرس"}</button>
            </>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-bold text-gray-800 mb-3">وضعیت پرداخت اعضا</h2>
        <table className="admin-table">
          <thead><tr><th>عضو</th><th>سهم</th><th>وضعیت</th></tr></thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.userId} style={m.userId === myUserId ? { background: "#f0f9ff" } : undefined}>
                <td>{m.name}{m.userId === myUserId ? " (شما)" : ""}</td>
                <td>{m.share.toLocaleString("fa-IR")} تومان</td>
                <td>{m.paymentStatus === "PAID" ? <span className="badge badge-success">پرداخت‌شده</span> : <span className="badge badge-warning">در انتظار</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {allPaid && <p className="text-xs text-green-600 mt-2">همه اعضا پرداخت کردند — در حال نهایی‌سازی سفارش...</p>}
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {me && me.paymentStatus === "PENDING" && (
        <button onClick={handlePay} disabled={paying || (isLeader && !addressSaved)} className="admin-btn admin-btn-primary w-full justify-center">
          {paying ? <Loader2 size={16} className="animate-spin" /> : null}
          {paying ? "در حال پرداخت..." : `پرداخت سهم من (${(me.share ?? 0).toLocaleString("fa-IR")} تومان) از کیف پول`}
        </button>
      )}
    </div>
  );
}