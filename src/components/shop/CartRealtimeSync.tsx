"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/store/cart-store";

export default function CartRealtimeSync() {
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    function subscribeForUser(userId: string) {
      if (channel) supabase.removeChannel(channel);

      channel = supabase
        .channel(`cart-sync-${userId}`)
        .on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "cart_items", filter: `user_id=eq.${userId}` },
          (payload) => {
            const old = payload.old as { product_id: string; selected_color: string | null; selected_size: string | null };
            removeItem(old.product_id, old.selected_color || null, old.selected_size || null);
          }
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "cart_items", filter: `user_id=eq.${userId}` },
          (payload) => {
            const row = payload.new as { product_id: string; selected_color: string | null; selected_size: string | null; quantity: number };
            updateQuantity(row.product_id, row.selected_color || null, row.selected_size || null, row.quantity);
          }
        )
        .subscribe();
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) subscribeForUser(session.user.id);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) subscribeForUser(session.user.id);
      else if (channel) { supabase.removeChannel(channel); channel = null; }
    });

    return () => {
      if (channel) supabase.removeChannel(channel);
      authListener.subscription.unsubscribe();
    };
  }, [removeItem, updateQuantity]);

  return null;
}