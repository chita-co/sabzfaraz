import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Plus, TrendingDown } from "lucide-react";

const statusLabels: Record<string, string> = {
  UPCOMING: "پیش‌رو", ACTIVE: "در حال کاهش قیمت", SOLD: "فروخته شد", ENDED_UNSOLD: "بدون خریدار", CANCELLED: "لغو شده",
};
const statusBadge: Record<string, string> = {
  UPCOMING: "badge badge-info", ACTIVE: "badge badge-success", SOLD: "badge badge-warning",
  ENDED_UNSOLD: "badge badge-danger", CANCELLED: "badge badge-danger",
};

export default async function AdminReverseAuctionsPage() {
  const supabase = await createClient();
  const { data: auctions } = await supabase.from("reverse_auctions").select("*").order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <TrendingDown size={20} className="text-amber-500" />
          <h1 className="text-xl font-bold text-gray-900">مدیریت حراج معکوس</h1>
        </div>
        <Link href="/admin/reverse-auctions/new" className="admin-btn admin-btn-primary flex items-center gap-2"><Plus size={16} /> کالای جدید</Link>
      </div>

      <div className="admin-card">
        <table className="admin-table">
          <thead><tr><th>عنوان</th><th>قیمت شروع</th><th>کف قیمت</th><th>وضعیت</th><th></th></tr></thead>
          <tbody>
            {(auctions ?? []).map((a) => (
              <tr key={a.id}>
                <td>{a.title}</td>
                <td>{a.starting_price.toLocaleString("fa-IR")} تومان</td>
                <td>{a.floor_price.toLocaleString("fa-IR")} تومان</td>
                <td><span className={statusBadge[a.status]}>{statusLabels[a.status]}</span></td>
                <td><Link href={`/admin/reverse-auctions/${a.id}`} className="admin-btn admin-btn-secondary">جزئیات</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!auctions || auctions.length === 0) && <p className="text-gray-500 text-sm text-center py-6">کالایی ثبت نشده است.</p>}
      </div>
    </div>
  );
}