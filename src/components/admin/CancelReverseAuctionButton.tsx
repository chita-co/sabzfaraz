"use client";

import { useState } from "react";
import { Ban } from "lucide-react";
import { cancelReverseAuction } from "@/app/admin/reverse-auctions/actions";

export default function CancelReverseAuctionButton({ auctionId }: { auctionId: string }) {
  const [loading, setLoading] = useState(false);
  async function handleClick() {
    if (!confirm("آیا از لغو این حراج معکوس مطمئن هستید؟")) return;
    setLoading(true);
    const result = await cancelReverseAuction(auctionId);
    setLoading(false);
    if (result?.error) alert(result.error);
    else window.location.reload();
  }
  return (
    <button onClick={handleClick} disabled={loading} className="admin-btn admin-btn-danger flex items-center gap-2">
      <Ban size={14} /> لغو
    </button>
  );
}