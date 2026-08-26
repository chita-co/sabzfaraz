import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const paymentLabels: Record<string, string> = {
  PENDING: "در انتظار",
  PAID: "پرداخت‌شده",
  FAILED: "ناموفق",
};

const paymentBadge: Record<string, string> = {
  PENDING: "badge badge-warning",
  PAID: "badge badge-success",
  FAILED: "badge badge-danger",
};

// نوع ردیف تراکنش
type TransactionRow = {
  id: string;
  order_number: string;
  total_amount: number;
  payment_status: string;
  zarinpal_ref_id?: string | null;
  sep_ref_num?: string | null;
  created_at: string;
  profile: { full_name: string | null } | null;
};

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("orders")
    .select("*, profile:profiles(full_name)")
    .order("created_at", { ascending: false });
  if (status) query = query.eq("payment_status", status);
  const { data: orders } = await query;

  const tabs = [
    { value: "", label: "همه" },
    { value: "PAID", label: "پرداخت‌شده" },
    { value: "PENDING", label: "در انتظار" },
    { value: "FAILED", label: "ناموفق" },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-5">تراکنش‌های مالی</h1>

      <div className="flex flex-wrap gap-2 mb-5">
        {tabs.map((t) => (
          <Link
            key={t.value}
            href={
              t.value
                ? `/admin/finance/transactions?status=${t.value}`
                : "/admin/finance/transactions"
            }
            className={`order-tab${(status ?? "") === t.value ? " active" : ""}`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>شماره سفارش</th>
              <th>مشتری</th>
              <th>مبلغ</th>
              <th>وضعیت پرداخت</th>
              <th>کد پیگیری درگاه</th>
              <th>تاریخ</th>
            </tr>
          </thead>
          <tbody>
            {(orders ?? []).map((o: TransactionRow) => (
              <tr key={o.id}>
                <td dir="ltr" className="text-left">
                  {o.order_number}
                </td>
                <td>{o.profile?.full_name ?? "—"}</td>
                <td>{o.total_amount.toLocaleString("fa-IR")} تومان</td>
                <td>
                  <span className={paymentBadge[o.payment_status]}>
                    {paymentLabels[o.payment_status]}
                  </span>
                </td>
                <td dir="ltr" className="text-left text-xs">
                   {o.sep_ref_num || o.zarinpal_ref_id || "—"}
                </td>
                <td className="text-xs text-gray-500">
                  {new Date(o.created_at).toLocaleDateString("fa-IR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!orders || orders.length === 0) && (
          <p className="text-gray-500 text-sm text-center py-6">
            تراکنشی یافت نشد.
          </p>
        )}
      </div>
    </div>
  );
}