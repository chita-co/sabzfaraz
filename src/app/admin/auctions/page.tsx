import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Plus, Gavel, Users, Wallet, TrendingUp } from "lucide-react";
import DeleteAuctionButton from "@/components/admin/DeleteAuctionButton";

const statusLabels: Record<string, string> = {
  UPCOMING: "پیش‌رو", ACTIVE: "فعال", ENDED: "پایان‌یافته",
  WINNER_DETERMINED: "برنده تعیین شد", CANCELLED: "لغو شده", FAILED_NO_WINNER: "بدون برنده",
};
const statusBadge: Record<string, string> = {
  UPCOMING: "badge badge-info", ACTIVE: "badge badge-success", ENDED: "badge badge-warning",
  WINNER_DETERMINED: "badge badge-success", CANCELLED: "badge badge-danger", FAILED_NO_WINNER: "badge badge-danger",
};

export default async function AdminAuctionsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("auctions").select("*").order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data: auctions } = await query;

  const { count: activeCount } = await supabase.from("auctions").select("*", { count: "exact", head: true }).eq("status", "ACTIVE");
  const { data: entryFeeTx } = await supabase.from("wallet_transactions").select("amount").eq("type", "debit").not("related_auction_id", "is", null);
  const totalEntryFees = (entryFeeTx ?? []).reduce((s, t) => s + Math.abs(t.amount), 0);
  const { data: winners } = await supabase.from("auctions").select("winner_bid_amount").eq("winner_payment_status", "PAID");
  const totalSold = (winners ?? []).reduce((s, w) => s + (w.winner_bid_amount ?? 0), 0);

  const tabs = [
    { value: "", label: "همه" }, { value: "UPCOMING", label: "پیش‌رو" }, { value: "ACTIVE", label: "فعال" },
    { value: "ENDED", label: "پایان‌یافته" }, { value: "WINNER_DETERMINED", label: "برنده تعیین شد" },
    { value: "CANCELLED", label: "لغو شده" }, { value: "FAILED_NO_WINNER", label: "بدون برنده" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">مدیریت مزایده‌ها</h1>
        <Link href="/admin/auctions/new" className="admin-btn admin-btn-primary flex items-center gap-2"><Plus size={16} /> مزایده جدید</Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card"><div className="stat-icon" style={{ background: "#16a34a" }}><Gavel size={20} /></div><div><div className="stat-value">{(activeCount ?? 0).toLocaleString("fa-IR")}</div><div className="stat-label">مزایده فعال</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{ background: "#f59e0b" }}><Wallet size={20} /></div><div><div className="stat-value">{totalEntryFees.toLocaleString("fa-IR")}</div><div className="stat-label">مجموع هزینه‌های شرکت (تومان)</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{ background: "#8b5cf6" }}><TrendingUp size={20} /></div><div><div className="stat-value">{totalSold.toLocaleString("fa-IR")}</div><div className="stat-label">مجموع فروش نهایی (تومان)</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{ background: "#3b82f6" }}><Users size={20} /></div><div><div className="stat-value">{(auctions ?? []).length.toLocaleString("fa-IR")}</div><div className="stat-label">تعداد کل مزایده‌ها</div></div></div>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {tabs.map((t) => (
          <Link key={t.value} href={t.value ? `/admin/auctions?status=${t.value}` : "/admin/auctions"} className={`order-tab${(status ?? "") === t.value ? " active" : ""}`}>{t.label}</Link>
        ))}
      </div>

      <div className="admin-card">
        <table className="admin-table">
          <thead><tr><th>عنوان</th><th>قیمت پایه</th><th>وضعیت</th><th>پایان</th><th></th></tr></thead>
          <tbody>
            {(auctions ?? []).map((a) => (
              <tr key={a.id}>
                <td>{a.title}</td>
                <td>{a.base_price.toLocaleString("fa-IR")} تومان</td>
                <td><span className={statusBadge[a.status]}>{statusLabels[a.status]}</span></td>
                <td className="text-xs text-gray-500">{new Date(a.ends_at).toLocaleString("fa-IR")}</td>
                <td>
  <div className="flex gap-1">
    <Link href={`/admin/auctions/${a.id}`} className="admin-btn admin-btn-secondary">جزئیات</Link>
    <Link href={`/admin/auctions/${a.id}#bid-history`} className="admin-btn admin-btn-secondary">تاریخچه پیشنهادها</Link>
    <DeleteAuctionButton auctionId={a.id} />
  </div>
</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!auctions || auctions.length === 0) && <p className="text-gray-500 text-sm text-center py-6">مزایده‌ای یافت نشد.</p>}
      </div>
    </div>
  );
}