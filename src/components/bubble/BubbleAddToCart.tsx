"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingCart, Check } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import type { BubbleItem } from "./types";

export default function BubbleAddToCart({ item }: { item: BubbleItem }) {
  const addItem = useCartStore((s) => s.addItem);

  const minQty = item.has_min_order_quantity && item.min_order_quantity ? Number(item.min_order_quantity) : 1;
  const step = item.is_sold_by_unit ? 0.1 : 1;
  const maxQty = item.stock ?? Infinity;
  const outOfStock = item.stock !== null && item.stock <= 0;

  const [qty, setQty] = useState(minQty);
  const [added, setAdded] = useState(false);

  const clamp = (v: number) => Math.round(Math.min(maxQty, Math.max(minQty, v)) * 10) / 10;

  function handleAdd() {
    if (outOfStock) return;
    addItem({
      productId: item.id,
      name: item.name,
      slug: item.slug,
      image: item.images?.[0] ?? "",
      price: item.price,
      discountPrice: item.discount_price,
      baseDiscountPrice: item.discount_price,
      flashEndsAt: item.flash_ends_at,
      selectedColor: item.colors?.[0]?.name ?? null,
      selectedSize: item.sizes?.[0] ?? null,
      quantity: qty,
      stock: item.stock,
      weightGrams: item.weight_grams,
      unitLabel: item.is_sold_by_unit ? item.unit_label : null,
      minQuantity: minQty,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="mt-3 flex w-full flex-col gap-2">
      <div className="flex w-full items-center justify-between rounded-full bg-white/25 px-2 py-1">
        <button
          type="button"
          onClick={() => setQty(clamp(qty - step))}
          disabled={outOfStock || qty <= minQty}
          className="grid h-7 w-7 place-items-center rounded-full bg-white/30 disabled:opacity-40"
          aria-label="کم کردن تعداد"
        >
          <Minus size={14} />
        </button>
        <span className="min-w-8 text-center text-sm font-bold">
          {qty.toLocaleString("fa-IR")}
          {item.is_sold_by_unit && item.unit_label ? ` ${item.unit_label}` : ""}
        </span>
        <button
          type="button"
          onClick={() => setQty(clamp(qty + step))}
          disabled={outOfStock || qty >= maxQty}
          className="grid h-7 w-7 place-items-center rounded-full bg-white/30 disabled:opacity-40"
          aria-label="افزایش تعداد"
        >
          <Plus size={14} />
        </button>
      </div>

      <button
        type="button"
        onClick={handleAdd}
        disabled={outOfStock}
        className="flex w-full items-center justify-center gap-1 rounded-full bg-linear-to-l from-cyan-400 to-pink-500 px-3 py-2 text-xs font-bold text-white disabled:opacity-40"
      >
        {added ? <Check size={14} /> : <ShoppingCart size={14} />}
        {outOfStock ? "ناموجود" : added ? "اضافه شد" : "افزودن به سبد"}
      </button>
    </div>
  );
}