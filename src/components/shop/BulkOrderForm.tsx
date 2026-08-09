"use client";

import { useState } from "react";
import { Plus, Trash2, ShoppingBag } from "lucide-react";
import { submitBulkOrder, getShippingCostForAddress, type BulkItemInput } from "@/app/bulk-order/actions";
import BankAccountDisplay, { type BankAccountInfo } from "./BankAccountDisplay";

interface AddressRow { id: string; full_name: string; phone: string; province: string; city: string; address_line: string; }

interface ItemRow extends BulkItemInput { id: string; }

export default function BulkOrderForm({
  addresses, bankAccounts, feeType, feeValue,
}: { addresses: AddressRow[]; bankAccounts: BankAccountInfo[]; feeType: string; feeValue: number }) {
  const [items, setItems] = useState<ItemRow[]>([{ id: crypto.randomUUID(), name: "", quantity: 1, estimatedPrice: 0, description: "" }]);
  const [addressId, setAddressId] = useState(addresses[0]?.id ?? "");
  const [shippingCost, setShippingCost] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"CARD_TO_CARD" | "SHEBA">("CARD_TO_CARD");
  const [bankAccountId, setBankAccountId] = useState(bankAccounts[0]?.id ?? "");
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadShipping(id: string) {
    setLoadingShipping(true);
    const result = await getShippingCostForAddress(id);
    setLoadingShipping(false);
    if (!result.error) setShippingCost(result.cost ?? 0);
  }

  function handleAddressChange(id: string) {
    setAddressId(id);
    loadShipping(id);
  }

  function addRow() {
    setItems((prev) => [...prev, { id: crypto.randomUUID(), name: "", quantity: 1, estimatedPrice: 0, description: "" }]);
  }
  function removeRow(id: string) {
    setItems((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  }
  function updateRow(id: string, field: keyof BulkItemInput, value: string | number) {
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  const subtotal = items.reduce((sum, i) => sum + (i.quantity || 0) * (i.estimatedPrice || 0), 0);
  const serviceFee = feeType === "percent" ? Math.round((subtotal * feeValue) / 100) : feeValue;
  const total = subtotal + serviceFee + (shippingCost ?? 0);
  const selectedBank = bankAccounts.find((b) => b.id === bankAccountId);

  async function handleSubmit() {
    setError(null);
    if (!addressId) { setError("لطفاً یک آدرس انتخاب کنید."); return; }
    if (!bankAccountId) { setError("لطفاً یک حساب بانکی انتخاب کنید."); return; }
    setSubmitting(true);
    const result = await submitBulkOrder(items, addressId, paymentMethod, bankAccountId);
    if (result?.error) { setError(result.error); setSubmitting(false); }
  }

  if (addresses.length === 0) {
    return <p className="text-gray-300 text-center py-16">برای ثبت سفارش جمعی، ابتدا باید یک آدرس در پروفایل خود ثبت کنید.</p>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center gap-2 mb-2">
        <ShoppingBag size={22} className="text-green-400" />
        <h1 className="text-xl font-bold text-white">سفارش جمعی از بازار الکترونیک</h1>
      </div>
      <p className="text-gray-300 text-sm mb-8">
        اقلامی که در فروشگاه ما موجود نیست رو اینجا لیست کن — ما از بازار برات تهیه و ارسال می‌کنیم.
      </p>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="font-bold text-gray-800 mb-4">لیست کالاهای موردنیاز</h2>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="grid grid-cols-12 gap-2 items-start border-b border-gray-100 pb-3">
              <input
                type="text" placeholder="نام کالا" value={item.name}
                onChange={(e) => updateRow(item.id, "name", e.target.value)}
                className="col-span-4 admin-input"
              />
              <input
                type="number" placeholder="تعداد" min={1} value={item.quantity}
                onChange={(e) => updateRow(item.id, "quantity", Number(e.target.value))}
                className="col-span-2 admin-input"
              />
              <input
                type="number" placeholder="قیمت تقریبی (اختیاری)" value={item.estimatedPrice || ""}
                onChange={(e) => updateRow(item.id, "estimatedPrice", Number(e.target.value))}
                className="col-span-3 admin-input"
              />
              <input
                type="text" placeholder="توضیحات" value={item.description}
                onChange={(e) => updateRow(item.id, "description", e.target.value)}
                className="col-span-2 admin-input"
              />
              <button onClick={() => removeRow(item.id)} className="col-span-1 admin-btn admin-btn-danger" type="button">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
        <button onClick={addRow} type="button" className="admin-btn admin-btn-secondary mt-3 flex items-center gap-1">
          <Plus size={14} /> افزودن کالای جدید
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="font-bold text-gray-800 mb-4">آدرس تحویل</h2>
        <div className="space-y-2">
          {addresses.map((a) => (
            <label key={a.id} className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer ${addressId === a.id ? "border-green-500 bg-green-50" : "border-gray-200"}`}>
              <input type="radio" checked={addressId === a.id} onChange={() => handleAddressChange(a.id)} className="mt-1" />
              <div className="text-sm">
                <p className="font-medium text-gray-800">{a.full_name} — {a.phone}</p>
                <p className="text-gray-600">{a.province}، {a.city}، {a.address_line}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="font-bold text-gray-800 mb-4">روش پرداخت</h2>
        <div className="payment-method-tabs">
          <div className={`payment-method-tab${paymentMethod === "CARD_TO_CARD" ? " active" : ""}`} onClick={() => setPaymentMethod("CARD_TO_CARD")}>کارت به کارت</div>
          <div className={`payment-method-tab${paymentMethod === "SHEBA" ? " active" : ""}`} onClick={() => setPaymentMethod("SHEBA")}>واریز به شبا</div>
        </div>
        <select value={bankAccountId} onChange={(e) => setBankAccountId(e.target.value)} className="admin-input w-full mb-3">
          {bankAccounts.map((b) => <option key={b.id} value={b.id}>{b.bank_name}</option>)}
        </select>
        {selectedBank && <BankAccountDisplay account={selectedBank} mode={paymentMethod === "CARD_TO_CARD" ? "card" : "sheba"} />}
        <div className="offline-payment-warning">
          لطفاً پس از ثبت سفارش، مبلغ را به حساب فوق واریز کرده و از طریق پشتیبانی (بخش «پشتیبانی» در منو) ما را از پرداخت مطلع کنید تا سفارش شما بررسی و پیگیری شود.
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 text-sm">
        <div className="flex justify-between py-1"><span>جمع تقریبی کالاها</span><span>{subtotal.toLocaleString("fa-IR")} تومان</span></div>
        <div className="flex justify-between py-1"><span>کارمزد خدمات</span><span>{serviceFee.toLocaleString("fa-IR")} تومان</span></div>
        <div className="flex justify-between py-1"><span>هزینه ارسال</span><span>{loadingShipping ? "در حال محاسبه..." : shippingCost !== null ? `${shippingCost.toLocaleString("fa-IR")} تومان` : "—"}</span></div>
        <div className="flex justify-between py-2 mt-2 border-t font-bold text-gray-900"><span>مبلغ نهایی تقریبی</span><span>{total.toLocaleString("fa-IR")} تومان</span></div>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <button onClick={handleSubmit} disabled={submitting} className="w-full rounded-full bg-green-600 py-3.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50">
        {submitting ? "در حال ثبت..." : "ثبت درخواست سفارش جمعی"}
      </button>
    </div>
  );
}