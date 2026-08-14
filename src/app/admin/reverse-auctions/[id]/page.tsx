import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Pencil } from "lucide-react";
import ConfirmReverseAuctionPaymentButton from "@/components/admin/ConfirmReverseAuctionPaymentButton";
import CancelReverseAuctionButton from "@/components/admin/CancelReverseAuctionButton";

const statusLabels: Record<string, string> = {
  UPCOMING: "پیش‌رو", ACTIVE: "در حال کاهش قیمت", SOLD: "فروخته شد", ENDED_UNSOLD: "بدون خریدار", CANCELLED: "لغو شده",
};

export default async function AdminReverseAuctionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: auction } = await supabase.from("reverse_auctions").select("*").eq("id", id).single();
  if (!auction) notFound();

  const { data: buyerOrder } = auction.winner_user_id
    ? await supabase.from("orders").select("*").eq("related_reverse_auction_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle()
    : { data: null };

  const { data: buyerProfile } = auction.winner_user_id
    ? await supabase.from("profiles").select("full_name, phone").eq("id", auction.winner_user_id).single()
    : { data: null };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-bold text-gray-900">{auction.title}</h1>
        <div className="flex gap-2">
          <Link href={`/admin/reverse-auctions/${id}/edit`} className="admin-btn admin-btn-secondary flex items-center gap-2"><Pencil size={14} /> ویرایش</Link>
          {["UPCOMING", "ACTIVE"].includes(auction.status) && <CancelReverseAuctionButton auctionId={id} />}
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-5">وضعیت: <span className="badge badge-info">{statusLabels[auction.status]}</span></p>

      <div className="admin-card mb-5">
        <table className="admin-table">
          <tbody>
            <tr><td>قیمت شروع</td><td>{auction.starting_price.toLocaleString("fa-IR")} تومان</td></tr>
            <tr><td>کف قیمت</td><td>{auction.floor_price.toLocaleString("fa-IR")} تومان</td></tr>
            <tr><td>مبلغ کاهش هر بار</td><td>{auction.drop_amount.toLocaleString("fa-IR")} تومان هر {auction.drop_interval_minutes.toLocaleString("fa-IR")} دقیقه</td></tr>
          </tbody>
        </table>
      </div>

      {auction.winner_user_id && (
        <div className="admin-card">
          <h2 className="font-bold text-gray-800 mb-3">خریدار و پرداخت نهایی</h2>
          <table className="admin-table">
            <tbody>
              <tr><td>خریدار</td><td>{buyerProfile?.full_name ?? "—"} <span className="text-xs text-gray-400" dir="ltr">{buyerProfile?.phone}</span></td></tr>
              <tr><td>قیمت فروش</td><td>{(auction.sold_price ?? 0).toLocaleString("fa-IR")} تومان</td></tr>
              <tr><td>مهلت پرداخت</td><td>{auction.payment_deadline ? new Date(auction.payment_deadline).toLocaleString("fa-IR") : "—"}</td></tr>
              <tr>
                <td>وضعیت پرداخت</td>
                <td>
                  <span className={`badge ${auction.payment_status === "PAID" ? "badge-success" : auction.payment_status === "EXPIRED" ? "badge-danger" : "badge-warning"}`}>
                    {auction.payment_status === "PAID" ? "پرداخت‌شده" : auction.payment_status === "EXPIRED" ? "منقضی‌شده" : "در انتظار پرداخت"}
                  </span>
                </td>
              </tr>
              {buyerOrder && (
                <tr>
                  <td>سفارش</td>
                  <td className="flex items-center gap-3">
                    <span>{buyerOrder.order_number}</span>
                    {buyerOrder.payment_status === "AWAITING_CONFIRMATION" && <ConfirmReverseAuctionPaymentButton orderId={buyerOrder.id} />}
                    <Link href={`/admin/orders/${buyerOrder.id}`} className="admin-btn admin-btn-secondary">مشاهده سفارش</Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}