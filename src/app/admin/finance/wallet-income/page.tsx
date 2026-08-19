import { createClient } from "@/lib/supabase/server";
import { Wallet } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminWalletIncomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: rows } = await supabase
    .from("wallet_transactions")
    .select("*, order:orders(order_number, user_id, profile:profiles(full_name, phone))")
    .eq("type", "credit")
    .eq("user_id", user?.id ?? "")
    .not("related_order_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(300);

  const totalIncome = (rows ?? []).reduce((s, r) => s + r.amount, 0);

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Wallet size={20} className="text-green-600" />
        <h1 className="text-xl font-bold text-gray-900">کیف پول ادمین — درآمد دریافتی از خریدهای کیف‌پولی</h1>
      </div>
      <p className="text-sm text-gray-500 mb-5">مجموع دریافتی: <b>{totalIncome.toLocaleString("fa-IR")} تومان</b> در {(rows ?? []).length.toLocaleString("fa-IR")} تراکنش</p>

      <div className="admin-card">
        <table className="admin-table">
          <thead><tr><th>مشتری</th><th>تلفن</th><th>مبلغ دریافتی</th><th>شماره سفارش</th><th>تاریخ و ساعت</th></tr></thead>
          <tbody>
            {(rows ?? []).map((r) => (
              <tr key={r.id}>
                <td>{r.order?.profile?.full_name ?? "—"}</td>
                <td dir="ltr">{r.order?.profile?.phone ?? "—"}</td>
                <td className="text-green-600 font-bold">{r.amount.toLocaleString("fa-IR")} تومان</td>
                <td dir="ltr">{r.order?.order_number ?? "—"}</td>
                <td className="text-xs text-gray-500">{new Date(r.created_at).toLocaleString("fa-IR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!rows || rows.length === 0) && <p className="text-gray-500 text-sm text-center py-6">هنوز پرداختی از طریق کیف پول دریافت نشده است.</p>}
      </div>
    </div>
  );
}