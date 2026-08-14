"use client";

import { useState } from "react";
import { extendAuctionManually, cancelAuction } from "@/app/admin/auctions/actions";

export default function AdminAuctionActions({ auctionId, status, endsAt }: { auctionId: string; status: string; endsAt: string }) {
  const [extendMinutes, setExtendMinutes] = useState("10");
  const [cancelReason, setCancelReason] = useState("");
  const [showCancel, setShowCancel] = useState(false);

  async function handleExtend() {
    const result = await extendAuctionManually(auctionId, Number(extendMinutes) || 10);
    if (result?.error) alert(result.error);
    else window.location.reload();
  }

  async function handleCancel() {
    if (!cancelReason.trim()) { alert("دلیل لغو را وارد کنید."); return; }
    if (!confirm("آیا از لغو این مزایده مطمئن هستید؟ هزینه‌های شرکت به همه بازگردانده می‌شود.")) return;
    const result = await cancelAuction(auctionId, cancelReason.trim());
    if (result?.error) alert(result.error);
    else window.location.reload();
  }

  if (["CANCELLED", "WINNER_DETERMINED", "FAILED_NO_WINNER"].includes(status)) return null;

  return (
    <div className="admin-card mb-5">
      <h2 className="font-bold text-gray-800 mb-3">اقدامات دستی</h2>
      <p className="text-xs text-gray-500 mb-3">زمان پایان فعلی: {new Date(endsAt).toLocaleString("fa-IR")}</p>
      <div className="flex gap-2 items-end mb-4 flex-wrap">
        <div className="admin-form-group" style={{ marginBottom: 0 }}>
          <label>تمدید (دقیقه)</label>
          <input type="number" value={extendMinutes} onChange={(e) => setExtendMinutes(e.target.value)} className="admin-input" style={{ width: 100 }} />
        </div>
        <button onClick={handleExtend} className="admin-btn admin-btn-secondary">تمدید دستی زمان پایان</button>
      </div>

      {!showCancel ? (
        <button onClick={() => setShowCancel(true)} className="admin-btn admin-btn-danger">لغو مزایده</button>
      ) : (
        <div className="flex gap-2 items-end flex-wrap">
          <div className="admin-form-group" style={{ marginBottom: 0, flex: 1 }}>
            <label>دلیل لغو (برای شرکت‌کنندگان نمایش داده می‌شود)</label>
            <input type="text" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} className="admin-input" />
          </div>
          <button onClick={handleCancel} className="admin-btn admin-btn-danger">تأیید لغو</button>
          <button onClick={() => setShowCancel(false)} className="admin-btn admin-btn-secondary">انصراف</button>
        </div>
      )}
    </div>
  );
}