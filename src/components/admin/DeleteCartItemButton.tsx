"use client";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteCartItemAction } from "@/app/admin/carts/actions";

export default function DeleteCartItemButton({ itemId }: { itemId: string }) {
  const [loading, setLoading] = useState(false);
  async function handleClick() {
    if (!confirm("این آیتم از سبد خرید کاربر حذف شود؟")) return;
    setLoading(true);
    await deleteCartItemAction(itemId);
    setLoading(false);
  }
  return (
    <button onClick={handleClick} disabled={loading} className="text-red-500 hover:text-red-700" aria-label="حذف">
      <Trash2 size={16} />
    </button>
  );
}