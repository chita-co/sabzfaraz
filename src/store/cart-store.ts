"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  discountPrice: number | null;
  selectedColor: string | null;
  selectedSize: string | null;
  quantity: number;
  stock: number | null;
  weightGrams: number | null;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, color: string | null, size: string | null) => void;
  updateQuantity: (productId: string, color: string | null, size: string | null, quantity: number) => void;
  clearCart: () => void;
}

function sameLine(a: CartItem, productId: string, color: string | null, size: string | null) {
  return a.productId === productId && a.selectedColor === color && a.selectedSize === size;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const existing = get().items.find((i) => sameLine(i, item.productId, item.selectedColor, item.selectedSize));
        if (existing) {
          set({
            items: get().items.map((i) =>
              sameLine(i, item.productId, item.selectedColor, item.selectedSize)
                ? { ...i, quantity: Math.min(i.quantity + item.quantity, i.stock ?? Infinity) }
                : i
            ),
          });
        } else {
          set({ items: [...get().items, item] });
        }
      },
      removeItem: (productId, color, size) => {
        set({ items: get().items.filter((i) => !sameLine(i, productId, color, size)) });
      },
      updateQuantity: (productId, color, size, quantity) => {
        set({
          items: get().items.map((i) =>
            sameLine(i, productId, color, size)
              ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stock ?? Infinity)) }
              : i
          ),
        });
      },
      clearCart: () => set({ items: [] }),
    }),
    { name: "sabzfaraz-cart" }
  )
);

export function useCartTotals() {
  const items = useCartStore((s) => s.items);
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + (i.discountPrice ?? i.price) * i.quantity, 0);
  return { totalItems, totalPrice };
}

export function useCartWeight() {
  const items = useCartStore((s) => s.items);
  return items.reduce((sum, i) => sum + (i.weightGrams ?? 0) * i.quantity, 0);
}