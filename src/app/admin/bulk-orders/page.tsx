import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const statusLabels: Record<string, string> = {
  PENDING_REVIEW: "در انتظار بررسی", PAYMENT_CONFIRMED: "پرداخت تأیید شد",
  REJECTED: "رد شده", COMPLETED: "تکمیل شده", CANCELLED: "لغو شده",
};
const statusBadge: Record<string, string> = {
  PENDING_REVIEW: "badge badge-warning", PAYMENT_CONFIRMED: "badge badge-success",
  REJECTED: "badge badge-danger", COMPLETED: "badge badge-info", CANCELLED: "badge badge-danger",
};

const tabs = [
  { value: "", label: "همه" }, { value: "PENDING_REVIEW", label: "در انتظار بررسی" },
  { value: "PAYMENT_CONFIRMED", label: "پرداخت تأیید شد" }, { value: "COMPLETED", label: "تکمیل‌شده" },
];

interface BulkOrderRow {
  id: string;
  request_number: string;
  total_estimated: number;
  status: string;
  created_at: string;
  items: unknown[];
  profile: { full_name: string | null; phone: string | null } | null;
}

export default async function AdminBulkOrdersPage({
  searchParams,
}: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("bulk_order_requests").select("*, profile:profiles(full_name, phone)").order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data: requests } = await query;

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-5">سفارشات جمعی</h1>

      <div className="flex flex-wrap gap-2 mb-5">
        {tabs.map((t) => (
          <Link key={t.value} href={t.value ? `/admin/bulk-orders?status=${t.value}` : "/admin/bulk-orders"} className={`order-tab${(status ?? "") === t.value ? " active" : ""}`}>
            {t.label}
          </Link>
        ))}
      </div>

      <div className="admin-card">
        <table className="admin-table">
          <thead><tr><th>شماره پیگیری</th><th>مشتری</th><th>تعداد اقلام</th><th>مبلغ نهایی</th><th>وضعیت</th><th>تاریخ</th><th></th></tr></thead>
          <tbody>
            {(requests ?? []).map((r: BulkOrderRow) => (
              <tr key={r.id}>
                <td dir="ltr" className="text-left">{r.request_number}</td>
                <td>{r.profile?.full_name ?? "—"}</td>
                <td>{(r.items).length.toLocaleString("fa-IR")}</td>
                <td>{r.total_estimated.toLocaleString("fa-IR")} تومان</td>
                <td><span className={statusBadge[r.status]}>{statusLabels[r.status]}</span></td>
                <td className="text-xs text-gray-500">{new Date(r.created_at).toLocaleDateString("fa-IR")}</td>
                <td><Link href={`/admin/bulk-orders/${r.id}`} className="admin-btn admin-btn-secondary">جزئیات</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!requests || requests.length === 0) && <p className="text-gray-500 text-sm text-center py-6">درخواستی ثبت نشده.</p>}
      </div>
    </div>
  );
}