"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/cart-store";
import { getLatestPrices } from "@/lib/cart/getLatestPrices";

export default function PriceSyncEffect() {
  const items = useCartStore((s) => s.items);
  const syncPrices = useCartStore((s) => s.syncPrices);

  useEffect(() => {
    const ids = Array.from(new Set(items.map((i) => i.productId)));
    if (ids.length === 0) return;
    getLatestPrices(ids).then((updates) => {
      if (updates.length > 0) syncPrices(updates);
    });
    // فقط یک‌بار موقع باز شدن صفحه اجرا شود؛ نباید items رو تو dependency بذاریم
    // وگرنه چون syncPrices خودش items رو عوض می‌کنه یه حلقه‌ی بی‌نهایت می‌سازه
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}