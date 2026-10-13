"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/cart-store";
import { getLatestPrices } from "@/lib/cart/getLatestPrices";

export default function BubbleCartWatcher() {
  const syncPrices = useCartStore((s) => s.syncPrices);
  const idsKey = useCartStore((s) =>
    s.items
      .map((i) => i.productId)
      .sort()
      .join(",")
  );

  useEffect(() => {
    if (!idsKey) return;
    const ids = idsKey.split(",");
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const run = async () => {
      const rows = await getLatestPrices(ids);
      if (cancelled) return;
      if (rows.length > 0) syncPrices(rows);

      // نزدیک‌ترین پایان حباب را پیدا می‌کنیم و یک تایمر تک‌بار برای آن می‌گذاریم
      const ends = rows
        .map((r) => (r.flashEndsAt ? new Date(r.flashEndsAt).getTime() : 0))
        .filter((t) => t > Date.now());
      if (ends.length > 0) {
        const delay = Math.min(Math.min(...ends) - Date.now() + 1500, 2147483000);
        timer = setTimeout(run, delay);
      }
    };

    run();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [idsKey, syncPrices]);

  return null;
}