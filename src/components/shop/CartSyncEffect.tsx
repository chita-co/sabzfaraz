"use client";

import { useEffect, useRef } from "react";
import { useCartStore } from "@/store/cart-store";
import { syncCartToServer } from "@/lib/cart/syncCartToServer";

export default function CartSyncEffect() {
  const items = useCartStore((s) => s.items);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      syncCartToServer(
        items.map((i) => ({
          productId: i.productId,
          name: i.name,
          image: i.image,
          price: i.price,
          discountPrice: i.discountPrice,
          selectedColor: i.selectedColor,
          selectedSize: i.selectedSize,
          quantity: i.quantity,
        }))
      );
    }, 1200);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [items]);

  return null;
}