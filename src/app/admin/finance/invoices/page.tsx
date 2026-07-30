import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Printer } from "lucide-react";

// نوع ردیف سفارش در این صفحه
type InvoiceRow = {
  id: string;
  order_number: string;
  total_amount: number;
  created_at: string;
  profile: { full_name: string | null } | null;
};

export default async function InvoicesPage() {
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("*, profile:profiles(full_name)")
    .eq("payment_status", "PAID")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-5">صورتحساب‌ها</h1>
      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>شماره سفارش</th>
              <th>مشتری</th>
              <th>مبلغ</th>
              <th>تاریخ</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(orders ?? []).map((o: InvoiceRow) => (
              <tr key={o.id}>
                <td dir="ltr" className="text-left">
                  {o.order_number}
                </td>
                <td>{o.profile?.full_name ?? "—"}</td>
                <td>{o.total_amount.toLocaleString("fa-IR")} تومان</td>
                <td className="text-xs text-gray-500">
                  {new Date(o.created_at).toLocaleDateString("fa-IR")}
                </td>
                <td>
                  <Link
                    href={`/admin/orders/${o.id}/invoice`}
                    target="_blank"
                    className="admin-btn admin-btn-secondary flex items-center gap-1"
                  >
                    <Printer size={14} /> مشاهده/چاپ
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!orders || orders.length === 0) && (
          <p className="text-gray-500 text-sm text-center py-6">
            هنوز صورتحسابی صادر نشده.
          </p>
        )}
      </div>
    </div>
  );
}