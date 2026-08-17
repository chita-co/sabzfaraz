import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Pencil } from "lucide-react";
import AdminAuctionActions from "@/components/admin/AdminAuctionActions";
import ConfirmAuctionPaymentButton from "@/components/admin/ConfirmAuctionPaymentButton";
import DeleteBidButton from "@/components/admin/DeleteBidButton";

const statusLabels: Record<string, string> = {
  UPCOMING: "پیش‌رو", ACTIVE: "فعال", ENDED: "پایان‌یافته",
  WINNER_DETERMINED: "برنده تعیین شد", CANCELLED: "لغو شده", FAILED_NO_WINNER: "بدون برنده",
};

export default async function AdminAuctionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: auction } = await supabase.from("auctions").select("*").eq("id", id).single();
  if (!auction) notFound();

  const { data: bids } = await supabase
    .from("auction_bids")
    .select("*, profile:profiles(full_name, phone)")
    .eq("auction_id", id)
    .order("amount", { ascending: false })
    .limit(200);

  const { data: participants } = await supabase
    .from("auction_participants")
    .select("*, profile:profiles(full_name, phone)")
    .eq("auction_id", id)
    .order("created_at", { ascending: false });

  const { data: winnerOrder } = auction.winner_user_id
    ? await supabase.from("orders").select("*").eq("related_auction_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle()
    : { data: null };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-bold text-gray-900">{auction.title}</h1>
        <Link href={`/admin/auctions/${id}/edit`} className="admin-btn admin-btn-secondary flex items-center gap-2"><Pencil size={14} /> ویرایش</Link>
      </div>
      <p className="text-sm text-gray-500 mb-5">وضعیت: <span className="badge badge-info">{statusLabels[auction.status] ?? auction.status}</span></p>

      <AdminAuctionActions auctionId={id} status={auction.status} endsAt={auction.ends_at} />

      {auction.winner_user_id && (
        <div className="admin-card mb-5">
          <h2 className="font-bold text-gray-800 mb-3">برنده و پرداخت نهایی</h2>
          <table className="admin-table">
            <tbody>
              <tr><td>مبلغ پیشنهادی برنده</td><td>{(auction.winner_bid_amount ?? 0).toLocaleString("fa-IR")} تومان</td></tr>
              <tr><td>مهلت پرداخت</td><td>{auction.winner_payment_deadline ? new Date(auction.winner_payment_deadline).toLocaleString("fa-IR") : "—"}</td></tr>
              <tr>
                <td>وضعیت پرداخت</td>
                <td>
                  <span className={`badge ${auction.winner_payment_status === "PAID" ? "badge-success" : auction.winner_payment_status === "EXPIRED" ? "badge-danger" : "badge-warning"}`}>
                    {auction.winner_payment_status === "PAID" ? "پرداخت‌شده" : auction.winner_payment_status === "EXPIRED" ? "منقضی‌شده" : "در انتظار پرداخت"}
                  </span>
                </td>
              </tr>
              {winnerOrder && (
                <tr>
                  <td>سفارش</td>
                  <td className="flex items-center gap-3">
                    <span>{winnerOrder.order_number}</span>
                    {winnerOrder.payment_status === "AWAITING_CONFIRMATION" && <ConfirmAuctionPaymentButton orderId={winnerOrder.id} />}
                    <Link href={`/admin/orders/${winnerOrder.id}`} className="admin-btn admin-btn-secondary">مشاهده سفارش</Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="admin-card mb-5">
        <h2 className="font-bold text-gray-800 mb-3">شرکت‌کنندگان و پرداخت هزینه شرکت ({(participants ?? []).length.toLocaleString("fa-IR")})</h2>
        <table className="admin-table">
          <thead><tr><th>کاربر</th><th>تلفن</th><th>مبلغ هزینه شرکت</th><th>روش</th><th>زمان پرداخت</th><th>وضعیت</th></tr></thead>
          <tbody>
            {(participants ?? []).map((p) => (
              <tr key={p.id}>
                <td>{p.profile?.full_name ?? "—"}</td>
                <td dir="ltr">{p.profile?.phone ?? "—"}</td>
                <td>{p.entry_fee_amount > 0 ? `${p.entry_fee_amount.toLocaleString("fa-IR")} تومان` : "رایگان"}</td>
                <td>از کیف پول</td>
                <td className="text-xs text-gray-500">{p.entry_fee_paid ? new Date(p.created_at).toLocaleString("fa-IR") : "—"}</td>
                <td>{p.entry_fee_paid ? <span className="badge badge-success">پرداخت شده</span> : <span className="badge badge-warning">پرداخت نشده</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!participants || participants.length === 0) && <p className="text-gray-500 text-sm text-center py-6">هنوز کسی در این مزایده شرکت نکرده است.</p>}
      </div>

      <div className="admin-card" id="bid-history">
  <h2 className="font-bold text-gray-800 mb-3">تاریخچه پیشنهادها مزایده «{auction.title}» ({(bids ?? []).length.toLocaleString("fa-IR")})</h2>
        <table className="admin-table">
          <thead><tr><th>کاربر</th><th>مبلغ</th><th>نوع</th><th>زمان</th><th></th></tr></thead>
          <tbody>
            {(bids ?? []).map((b) => (
              <tr key={b.id}>
                <td>{b.is_bot ? b.bot_name : (b.profile?.full_name ?? "—")}</td>
                <td>{b.amount.toLocaleString("fa-IR")} تومان</td>
                <td>{b.is_bot ? <span className="badge badge-warning">ربات</span> : <span className="badge badge-success">واقعی</span>}</td>
                <td className="text-xs text-gray-500">{new Date(b.created_at).toLocaleString("fa-IR")}</td>
                <td><DeleteBidButton bidId={b.id} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!bids || bids.length === 0) && <p className="text-gray-500 text-sm text-center py-6">هنوز پیشنهادی ثبت نشده است.</p>}
      </div>
    </div>
  );
}