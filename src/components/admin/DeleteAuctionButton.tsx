"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteAuction } from "@/app/admin/auctions/actions";

export default function DeleteAuctionButton({ auctionId }: { auctionId: string }) {
  const [loading, setLoading] = useState(false);
  async function handleClick() {
    if (!confirm("آیا از حذف کامل این مزایده مطمئن هستید؟ در صورت وجود شرکت‌کننده، هزینه‌های شرکت آن‌ها بازگردانده می‌شود.")) return;
    setLoading(true);
    const result = await deleteAuction(auctionId);
    setLoading(false);
    if (result?.error) alert(result.error);
    else window.location.reload();
  }
  return (
    <button onClick={handleClick} disabled={loading} className="admin-btn admin-btn-danger"><Trash2 size={13} /></button>
  );
}