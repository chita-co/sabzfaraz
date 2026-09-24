"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartQuantityTier {
  min_qty: number;
  max_qty: number;
  unit_price: number;
}

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
  unitLabel: string | null;
  minQuantity?: number;
  isChinaOrder?: boolean;
  chinaDeliveryText?: string | null;
  chinaTermsText?: string | null;
  chinaOrderNote?: string | null;
  cartItemId?: string | null;
  quantityTiers?: CartQuantityTier[];
  baseDiscountPrice?: number | null;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, color: string | null, size: string | null) => void;
  updateQuantity: (productId: string, color: string | null, size: string | null, quantity: number) => void;
  clearCart: () => void;
  restoreItems: (items: CartItem[]) => void;
  orderNote: string;
  setOrderNote: (note: string) => void;
  syncPrices: (updates: { productId: string; price: number; discountPrice: number | null; stock: number | null; quantityTiers?: CartQuantityTier[] }[]) => void;
  setCartItemIds: (mapping: { productId: string; color: string | null; size: string | null; id: string }[]) => void;
  removeItemById: (id: string) => void;
}

// قیمت واحد را بر اساس تعداد فعلی و قیمت پلکانی محصول حساب می‌کند.
// برای محصولاتی که قیمت پلکانی ندارند هیچ تغییری نمی‌دهد.
function withTierPrice(item: CartItem): CartItem {
  const tiers = item.quantityTiers;
  if (!tiers || tiers.length === 0 || item.isChinaOrder) return item;
  const matched = tiers.find((t) => item.quantity >= t.min_qty && item.quantity <= t.max_qty);
  const discountPrice = matched ? matched.unit_price : (item.baseDiscountPrice ?? null);
  return discountPrice === item.discountPrice ? item : { ...item, discountPrice };
}

function sameLine(a: CartItem, productId: string, color: string | null, size: string | null) {
  return a.productId === productId && a.selectedColor === color && a.selectedSize === size;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      orderNote: "",
      addItem: (item) => {
        const existing = get().items.find((i) => sameLine(i, item.productId, item.selectedColor, item.selectedSize));
        if (existing) {
          set({
            items: get().items.map((i) =>
              sameLine(i, item.productId, item.selectedColor, item.selectedSize)
                ? withTierPrice({
                    ...i,
                    quantity: Math.min(i.quantity + item.quantity, i.stock ?? Infinity),
                    quantityTiers: item.quantityTiers ?? i.quantityTiers,
                    baseDiscountPrice: item.baseDiscountPrice !== undefined ? item.baseDiscountPrice : i.baseDiscountPrice,
                  })
                : i
            ),
          });
        } else {
          set({ items: [...get().items, withTierPrice(item)] });
        }
      },
      removeItem: (productId, color, size) => {
        set({ items: get().items.filter((i) => !sameLine(i, productId, color, size)) });
      },
      updateQuantity: (productId, color, size, quantity) => {
        set({
          items: get().items.map((i) =>
            sameLine(i, productId, color, size)
              ? withTierPrice({ ...i, quantity: Math.max(1, Math.min(quantity, i.stock ?? Infinity)) })
              : i
          ),
        });
      },
      clearCart: () => set({ items: [] }),
      restoreItems: (items) => set({ items: [...get().items, ...items.map(withTierPrice)] }),
      setOrderNote: (note) => set({ orderNote: note }),
      syncPrices: (updates) => {
        set({
          items: get().items.map((i) => {
            const u = updates.find((x) => x.productId === i.productId);
            if (!u) return i;
            const newStock = u.stock;
            return withTierPrice({
              ...i,
              price: u.price,
              discountPrice: u.discountPrice,
              baseDiscountPrice: u.discountPrice,
              quantityTiers: u.quantityTiers !== undefined ? u.quantityTiers : i.quantityTiers,
              stock: newStock,
              quantity: newStock !== null ? Math.min(i.quantity, Math.max(newStock, 0)) : i.quantity,
            });
          }),
        });
      },
      setCartItemIds: (mapping) => {
        set({
          items: get().items.map((i) => {
            const m = mapping.find((x) => x.productId === i.productId && x.color === i.selectedColor && x.size === i.selectedSize);
            return m ? { ...i, cartItemId: m.id } : i;
          }),
        });
      },
      removeItemById: (id) => {
        set({ items: get().items.filter((i) => i.cartItemId !== id) });
      },
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