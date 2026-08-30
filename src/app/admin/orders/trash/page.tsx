import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import TrashedOrderActions from "@/components/admin/TrashedOrderActions";
import EmptyTrashButton from "@/components/admin/EmptyTrashButton";

type TrashedOrderRow = {
  id: string;
  order_number: string;
  total_amount: number;
  deleted_at: string;
  profile: { full_name: string | null } | null;
};

export default async function AdminOrdersTrashPage() {
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, total_amount, deleted_at, profile:profiles(full_name)")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });

  const list = (orders ?? []) as unknown as TrashedOrderRow[];

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">سطل زباله سفارش‌ها</h1>
          <p className="text-sm text-gray-500 mt-1">سفارش‌های حذف‌شده تا وقتی کامل پاک نشوند، اینجا نگه‌داری می‌شوند.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/orders" className="admin-btn admin-btn-secondary">بازگشت به لیست سفارش‌ها</Link>
          {list.length > 0 && <EmptyTrashButton />}
        </div>
      </div>

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>شماره سفارش</th>
              <th>مشتری</th>
              <th>مبلغ</th>
              <th>تاریخ حذف</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map((o) => (
              <tr key={o.id}>
                <td dir="ltr" className="text-left">{o.order_number}</td>
                <td>{o.profile?.full_name ?? "—"}</td>
                <td>{o.total_amount.toLocaleString("fa-IR")} تومان</td>
                <td className="text-xs text-gray-500">{new Date(o.deleted_at).toLocaleString("fa-IR")}</td>
                <td><TrashedOrderActions orderId={o.id} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <p className="text-gray-500 text-sm text-center py-6">سطل زباله خالیه.</p>}
      </div>
    </div>
  );
}