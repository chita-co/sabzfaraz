import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import OrderDeleteButton from "@/components/admin/OrderDeleteButton";
import StaleOrdersCleanupButton from "@/components/admin/StaleOrdersCleanupButton";


const statusColors: Record<string, string> = {
  PENDING: "text-yellow-600",
  PROCESSING: "text-blue-600",
  PACKING: "text-orange-600",
  SHIPPED: "text-purple-600",
  DELIVERED: "text-green-600",
  CANCELLED: "text-red-600",
};

const statusLabels: Record<string, string> = {
  PENDING: "در انتظار پرداخت",
  PROCESSING: "در حال پردازش",
  PACKING: "آماده‌سازی و بسته‌بندی",
  SHIPPED: "ارسال شده",
  DELIVERED: "تحویل داده شده",
  CANCELLED: "لغو شده",
};

const tabs = [
  { value: "", label: "همه" },
  { value: "PENDING", label: "در انتظار پرداخت" },
  { value: "PROCESSING", label: "در حال پردازش" },
  { value: "PACKING", label: "آماده‌سازی و بسته‌بندی" },
  { value: "SHIPPED", label: "ارسال شده" },
  { value: "DELIVERED", label: "تحویل داده شده" },
  { value: "CANCELLED", label: "لغو شده" },
];

// نوع دقیق برای ردیف‌های سفارش
type OrderRow = {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  admin_viewed_at: string | null;
  profile: { full_name: string | null } | null;
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("orders")
    .select("*, admin_viewed_at, profile:profiles(full_name)")
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data: orders } = await query;

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h1 className="text-xl font-bold text-gray-900">مدیریت سفارش‌ها</h1>
        <StaleOrdersCleanupButton />
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {tabs.map((t) => (
          <Link
            key={t.value}
            href={t.value ? `/admin/orders?status=${t.value}` : "/admin/orders"}
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
              <th>وضعیت سفارش</th>
              <th>تاریخ</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(orders ?? []).map((o: OrderRow) => (
              <tr key={o.id}>
                <td dir="ltr" className="text-left" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: o.admin_viewed_at ? "#16a34a" : "#dc2626" }} title={o.admin_viewed_at ? "دیده‌شده" : "سفارش جدید"} />
                  {o.order_number}
                </td>
                <td>{o.profile?.full_name ?? "—"}</td>
                <td>{o.total_amount.toLocaleString("fa-IR")} تومان</td>
                <td>
                  {o.payment_status === "PAID" ? (
                    <span className="text-green-600 text-xs font-medium">پرداخت‌شده</span>
                  ) : o.payment_status === "FAILED" ? (
                    <span className="text-red-600 text-xs font-medium">ناموفق</span>
                  ) : (
                    <span className="text-yellow-600 text-xs font-medium">در انتظار</span>
                  )}
                </td>
                <td>
                  <span className={`text-xs font-medium ${statusColors[o.status]}`}>
                    {statusLabels[o.status]}
                  </span>
                </td>
                <td className="text-xs text-gray-500">
                  {new Date(o.created_at).toLocaleDateString("fa-IR")}
                </td>
                <td>
                  <div className="flex gap-2">
                    <Link href={`/admin/orders/${o.id}`} className="admin-btn admin-btn-secondary">
                      جزئیات
                    </Link>
                    <OrderDeleteButton orderId={o.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(!orders || orders.length === 0) && (
          <p className="text-gray-500 text-sm text-center py-6">سفارشی یافت نشد.</p>
        )}
      </div>
    </div>
  );
}