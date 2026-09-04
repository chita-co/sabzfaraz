"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/store/cart-store";

export default function ProductPriceRealtimeSync() {
  const syncPrices = useCartStore((s) => s.syncPrices);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("products-price-sync")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "products" },
        (payload) => {
          const row = payload.new as { id: string; price: number; discount_price: number | null; stock: number | null };

          // فقط اگر این محصول واقعاً داخل سبد خرید فعلی کاربر باشد، آپدیت اعمال شود
          const inCart = useCartStore.getState().items.some((i) => i.productId === row.id);
          if (!inCart) return;

          syncPrices([{ productId: row.id, price: row.price, discountPrice: row.discount_price, stock: row.stock }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [syncPrices]);

  return null;
}