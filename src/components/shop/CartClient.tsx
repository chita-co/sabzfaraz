// src/components/shop/CartClient.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Trash2, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cart-store";

export default function CartClient({ isLoggedIn }: { isLoggedIn: boolean }) {
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const router = useRouter();

  const totalPrice = items.reduce((sum, i) => sum + (i.discountPrice ?? i.price) * i.quantity, 0);

  function handleCheckout() {
    router.push(isLoggedIn ? "/checkout" : "/login?redirect=/checkout");
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
        <h1 className="text-lg font-bold text-white mb-2">سبد خرید شما خالی است</h1>
        <Link href="/" className="text-green-400 hover:underline text-sm">
  بازگشت به فروشگاه و انتخاب محصول
</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-xl font-bold text-white mb-6">سبد خرید</h1>

      <div className="space-y-4 mb-8">
        {items.map((item) => (
          <div
            key={`${item.productId}-${item.selectedColor}-${item.selectedSize}`}
            className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4"
          >
            <Link href={`/products/${item.slug}`} className="w-20 h-20 relative shrink-0 block">
              <Image
                src={item.image}
                alt={item.name}
                fill
                className="object-cover rounded-lg"
                sizes="80px"
              />
            </Link>
            <div className="flex-1 min-w-0">
              <Link href={`/products/${item.slug}`} className="font-medium text-gray-800 hover:text-green-600 line-clamp-1">
                {item.name}
              </Link>
              <p className="text-xs text-gray-500 mt-1">
                {[item.selectedColor, item.selectedSize].filter(Boolean).join(" / ") || "—"}
              </p>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2 border border-gray-200 rounded-full px-2 py-1">
                  <button
                    onClick={() => updateQuantity(item.productId, item.selectedColor, item.selectedSize, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    <Minus size={14} />
                  </button>
                  <span className="text-sm w-5 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.selectedColor, item.selectedSize, item.quantity + 1)}
                    disabled={item.stock !== null && item.quantity >= item.stock}
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <span className="font-bold text-gray-900 text-sm">
                  {((item.discountPrice ?? item.price) * item.quantity).toLocaleString("fa-IR")} تومان
                </span>
              </div>
            </div>
            <button
              onClick={() => removeItem(item.productId, item.selectedColor, item.selectedSize)}
              className="text-red-500 self-start"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-white/70">مبلغ قابل پرداخت</p>
          <p className="text-xl font-bold text-white">{totalPrice.toLocaleString("fa-IR")} تومان</p>
        </div>
        <button onClick={handleCheckout} className="rounded-full bg-green-600 px-8 py-3 text-sm font-bold text-white hover:bg-green-700">
          ادامه فرآیند خرید
        </button>
      </div>
    </div>
  );
}