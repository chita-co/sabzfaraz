"use client";

import { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { Product } from "@/types";

export default function QuickAddButton({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      image: product.images?.[0] ?? "",
      price: product.price,
      discountPrice: product.discount_price,
      selectedColor: product.colors?.[0]?.name ?? null,
      selectedSize: product.sizes?.[0] ?? null,
      quantity: 1,
      stock: product.stock,
      weightGrams: product.weight_grams,
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <button onClick={handleClick} className={`quick-add-btn${added ? " added" : ""}`} aria-label="افزودن سریع به سبد خرید">
      {added ? <Check size={16} /> : <ShoppingCart size={16} />}
    </button>
  );
}