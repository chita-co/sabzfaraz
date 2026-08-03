"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useCartStore, useCartWeight } from "@/store/cart-store";
import { createOrderAndPay } from "@/app/(shop)/checkout/actions";
import ProformaInvoiceButton from "./ProformaInvoiceButton";

interface AddressRow {
  id: string; full_name: string; phone: string;
  province: string; city: string; postal_code: string; address_line: string;
}
interface ShippingMethod { id: string; name: string; }
interface ShippingTier { id: string; method_id: string; min_weight_grams: number; max_weight_grams: number; cost: number; }

export default function CheckoutClient({
  addresses, shippingMethods, shippingTiers, storeInfo,
}: {
  addresses: AddressRow[]; shippingMethods: ShippingMethod[]; shippingTiers: ShippingTier[];
  storeInfo: { name: string; phones: string[]; address: string; logoUrl: string | null };
}) {
  const items = useCartStore((s) => s.items);
  const cartWeightGrams = useCartWeight();

  const [selectedAddress, setSelectedAddress] = useState(addresses[0]?.id ?? "");
  const [selectedMethodId, setSelectedMethodId] = useState(shippingMethods[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = items.reduce((sum, i) => sum + (i.discountPrice ?? i.price) * i.quantity, 0);

  const shippingCost = useMemo(() => {
    const methodTiers = shippingTiers.filter((t) => t.method_id === selectedMethodId).sort((a, b) => a.min_weight_grams - b.min_weight_grams);
    if (methodTiers.length === 0) return 0;
    const matched = methodTiers.find((t) => cartWeightGrams >= t.min_weight_grams && cartWeightGrams <= t.max_weight_grams);
    if (matched) return matched.cost;
    return methodTiers[methodTiers.length - 1].cost;
  }, [selectedMethodId, shippingTiers, cartWeightGrams]);

  const total = subtotal + shippingCost;

  async function handlePay() {
    if (!selectedAddress) { setError("لطفاً یک آدرس انتخاب کنید."); return; }
    if (!selectedMethodId) { setError("لطفاً یک روش ارسال انتخاب کنید."); return; }
    setLoading(true);
    setError(null);

    const result = await createOrderAndPay(
      items.map((i) => ({
        productId: i.productId, name: i.name, image: i.image, price: i.price,
        discountPrice: i.discountPrice, selectedColor: i.selectedColor,
        selectedSize: i.selectedSize, quantity: i.quantity,
      })),
      selectedAddress,
      shippingCost
    );
    if (result?.error) { setError(result.error); setLoading(false); }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-gray-500">سبد خرید شما خالی است.</p>
        <Link href="/" className="text-green-600 text-sm hover:underline">بازگشت به فروشگاه</Link>
      </div>
    );
  }
  if (addresses.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-gray-500 mb-4">برای ثبت سفارش، ابتدا باید یک آدرس در پروفایل خود ثبت کنید.</p>
        <Link href="/profile" className="rounded-full bg-green-600 px-6 py-2 text-sm text-white hover:bg-green-700">افزودن آدرس</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-xl font-bold text-gray-900 mb-6">تکمیل خرید</h1>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="font-bold text-gray-800 mb-4">انتخاب آدرس ارسال</h2>
        <div className="space-y-3">
          {addresses.map((a) => (
            <label key={a.id} className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer ${selectedAddress === a.id ? "border-green-500 bg-green-50" : "border-gray-200"}`}>
              <input type="radio" name="address" checked={selectedAddress === a.id} onChange={() => setSelectedAddress(a.id)} className="mt-1" />
              <div className="text-sm">
                <p className="font-medium text-gray-800">{a.full_name} — {a.phone}</p>
                <p className="text-gray-600">{a.province}، {a.city}</p>
                <p className="text-gray-600">{a.address_line}</p>
                <p className="text-gray-500 text-xs mt-1">کد پستی: {a.postal_code}</p>
              </div>
            </label>
          ))}
        </div>
        <Link href="/profile" className="inline-block mt-3 text-sm text-green-600 hover:underline">+ افزودن آدرس جدید</Link>
      </div>

      {shippingMethods.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="font-bold text-gray-800 mb-4">روش ارسال</h2>
          <div className="space-y-2">
            {shippingMethods.map((m) => (
              <label key={m.id} className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer ${selectedMethodId === m.id ? "border-green-500 bg-green-50" : "border-gray-200"}`}>
                <input type="radio" name="method" checked={selectedMethodId === m.id} onChange={() => setSelectedMethodId(m.id)} />
                <span className="text-sm font-medium text-gray-800">{m.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="font-bold text-gray-800 mb-4">خلاصه سفارش</h2>
        {items.map((item) => (
          <div key={`${item.productId}-${item.selectedColor}-${item.selectedSize}`} className="flex justify-between text-sm py-2 border-b last:border-0">
            <span>{item.name} × {item.quantity}</span>
            <span>{((item.discountPrice ?? item.price) * item.quantity).toLocaleString("fa-IR")} تومان</span>
          </div>
        ))}
        <div className="flex justify-between text-sm py-2 border-b"><span>جمع کالاها</span><span>{subtotal.toLocaleString("fa-IR")} تومان</span></div>
        <div className="flex justify-between text-sm py-2 border-b"><span>هزینه ارسال و بسته‌بندی</span><span>{shippingCost.toLocaleString("fa-IR")} تومان</span></div>
        <div className="flex justify-between font-bold text-gray-900 mt-3 pt-3"><span>مبلغ نهایی قابل پرداخت</span><span>{total.toLocaleString("fa-IR")} تومان</span></div>
      </div>

      {selectedAddress && (
        <div className="mb-6">
          <ProformaInvoiceButton
            items={items}
            subtotal={subtotal}
            shippingCost={shippingCost}
            storeInfo={storeInfo}
            buyer={(() => {
              const addr = addresses.find((a) => a.id === selectedAddress)!;
              return { fullName: addr.full_name, phone: addr.phone, province: addr.province, city: addr.city, addressLine: addr.address_line };
            })()}
          />
        </div>
      )}

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <button onClick={handlePay} disabled={loading} className="w-full rounded-full bg-green-600 py-3.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50">
        {loading ? "در حال اتصال به درگاه پرداخت..." : "پرداخت و ثبت نهایی سفارش"}
      </button>
    </div>
  );
}