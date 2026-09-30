"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/cart-store";
import { getLatestPrices } from "@/lib/cart/getLatestPrices";

const POLL_MS = 30000;

// قیمت و موجودی سبد را هر ۳۰ ثانیه (فقط وقتی تب دیده می‌شود) و هنگام برگشتن به تب تازه می‌کند.
// بار اولِ باز شدن صفحه را PriceSyncEffect انجام می‌دهد.
export default function ProductPriceRealtimeSync() {
  const syncPrices = useCartStore((s) => s.syncPrices);
  const idsKey = useCartStore((s) =>
    Array.from(new Set(s.items.map((i) => i.productId))).sort().join(",")
  );

  useEffect(() => {
    if (!idsKey) return;
    const ids = idsKey.split(",");
    let cancelled = false;
    let lastRun = 0;

    async function refresh() {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastRun < 5000) return;
      lastRun = Date.now();
      try {
        const updates = await getLatestPrices(ids);
        if (!cancelled && updates.length > 0) syncPrices(updates);
      } catch (e) {
        console.warn("به‌روزرسانی قیمت سبد ناموفق بود:", e);
      }
    }

    const interval = setInterval(refresh, POLL_MS);
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [idsKey, syncPrices]);

  return null;
}