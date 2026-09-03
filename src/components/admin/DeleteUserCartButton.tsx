"use client";
import { useState } from "react";
import { deleteUserCartAction } from "@/app/admin/carts/actions";

export default function DeleteUserCartButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);
  async function handleClick() {
    if (!confirm("کل سبد خرید این کاربر حذف شود؟")) return;
    setLoading(true);
    await deleteUserCartAction(userId);
    setLoading(false);
  }
  return (
    <button onClick={handleClick} disabled={loading} className="admin-btn admin-btn-secondary">
      حذف کل سبد
    </button>
  );
}