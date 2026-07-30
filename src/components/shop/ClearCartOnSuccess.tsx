"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/cart-store";

export default function ClearCartOnSuccess() {
  const clearCart = useCartStore((s) => s.clearCart);
  useEffect(() => { clearCart(); }, [clearCart]);
  return null;
}