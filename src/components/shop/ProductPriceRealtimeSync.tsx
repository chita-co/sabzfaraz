"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/store/cart-store";

export default function ProductPriceRealtimeSync() {
  const syncPrices = useCartStore((s) => s.syncPrices);
  const idsKey = useCartStore((s) =>
    Array.from(new Set(s.items.map((i) => i.productId))).sort().join(",")
  );

  useEffect(() => {
    if (!idsKey) return; // سبد خالی است، نیازی به سابسکرایب نیست

    const supabase = createClient();
    const ids = idsKey.split(",");

    const channel = supabase
      .channel(`products-price-sync-${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "products",
          filter: `id=in.(${ids.join(",")})`,
        },
        (payload) => {
          const row = payload.new as { id: string; price: number; discount_price: number | null; stock: number | null };
          syncPrices([{ productId: row.id, price: row.price, discountPrice: row.discount_price, stock: row.stock }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [idsKey, syncPrices]);

  return null;
}