"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteAuctionBid } from "@/app/admin/auctions/actions";

export default function DeleteBidButton({ bidId }: { bidId: string }) {
  const [loading, setLoading] = useState(false);
  async function handleClick() {
    if (!confirm("آیا از حذف این پیشنهاد مطمئن هستید؟ این عملیات قابل بازگشت نیست.")) return;
    setLoading(true);
    const result = await deleteAuctionBid(bidId);
    setLoading(false);
    if (result?.error) alert(result.error);
    else window.location.reload();
  }
  return (
    <button onClick={handleClick} disabled={loading} className="admin-btn admin-btn-danger" style={{ padding: "4px 8px" }}>
      <Trash2 size={12} />
    </button>
  );
}