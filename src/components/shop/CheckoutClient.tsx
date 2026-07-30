"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useCartStore } from "@/store/cart-store";
import { createOrderAndPay } from "@/app/(shop)/checkout/actions";

interface AddressRow {
  id: string; full_name: string; phone: string;
  province: string; city: string; postal_code: string; address_line: string;
}
interface ShippingRate { id: string; province: string; city: string | null; cost: number; }

export default function CheckoutClient({
  addresses,
  shippingRates,
  defaultShippingCost,
}: {
  addresses: AddressRow[];
  shippingRates: ShippingRate[];
  defaultShippingCost: number;
}) {
  const items = useCartStore((s) => s.items);
  const [selectedAddress, setSelectedAddress] = useState(addresses[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = items.reduce((sum, i) => sum + (i.discountPrice ?? i.price) * i.quantity, 0);

  const shippingCost = useMemo(() => {
    const addr = addresses.find((a) => a.id === selectedAddress);
    if (!addr) return defaultShippingCost;

    const cityRate = shippingRates.find(
      (r) => r.province === addr.province && r.city === addr.city
    );
    if (cityRate) return cityRate.cost;

    const provinceRate = shippingRates.find(
      (r) => r.province === addr.province && !r.city
    );
    if (provinceRate) return provinceRate.cost;

    return defaultShippingCost;
  }, [selectedAddress, addresses, shippingRates, defaultShippingCost]);
  
  const total = subtotal + shippingCost;

  async function handlePay() {
    if (!selectedAddress) { setError("لطفاً یک آدرس انتخاب کنید."); return; }
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
        <Link href="/profile" className="rounded-full bg-green-600 px-6 py-2 text-sm text-white hover:bg-green-700">
          افزودن آدرس
        </Link>
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

      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="font-bold text-gray-800 mb-4">خلاصه سفارش</h2>
        {items.map((item) => (
          <div key={`${item.productId}-${item.selectedColor}-${item.selectedSize}`} className="flex justify-between text-sm py-2 border-b last:border-0">
            <span>{item.name} × {item.quantity}</span>
            <span>{((item.discountPrice ?? item.price) * item.quantity).toLocaleString("fa-IR")} تومان</span>
          </div>
        ))}
        <div className="flex justify-between text-sm py-2 border-b">
          <span>جمع کالاها</span>
          <span>{subtotal.toLocaleString("fa-IR")} تومان</span>
        </div>
        <div className="flex justify-between text-sm py-2 border-b">
          <span>هزینه ارسال (تیپاکس)</span>
          <span>{shippingCost.toLocaleString("fa-IR")} تومان</span>
        </div>
        <div className="flex justify-between font-bold text-gray-900 mt-3 pt-3">
          <span>مبلغ نهایی قابل پرداخت</span>
          <span>{total.toLocaleString("fa-IR")} تومان</span>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <button onClick={handlePay} disabled={loading} className="w-full rounded-full bg-green-600 py-3.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50">
        {loading ? "در حال اتصال به درگاه پرداخت..." : "پرداخت و ثبت نهایی سفارش"}
      </button>
    </div>
  );
}