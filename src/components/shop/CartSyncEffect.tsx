"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { useCartStore } from "@/store/cart-store";
import { syncCartToServer } from "@/lib/cart/syncCartToServer";

const subscribeToHydration = (callback: () => void) =>
  useCartStore.persist.onFinishHydration(callback);

const getHydratedSnapshot = () =>
  useCartStore.persist.hasHydrated();

const getServerSnapshot = () => false;

export default function CartSyncEffect() {
  const items = useCartStore((s) => s.items);
  const setCartItemIds = useCartStore((s) => s.setCartItemIds);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydratedSnapshot,
    getServerSnapshot
  );

  useEffect(() => {
    if (!hydrated) return;

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
      ).then((mapping) => {
        if (mapping && mapping.length > 0) setCartItemIds(mapping);
      });
    }, 1200);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [items, setCartItemIds, hydrated]);

  return null;
}