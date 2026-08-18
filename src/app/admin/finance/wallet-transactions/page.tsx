import { createClient } from "@/lib/supabase/server";

const typeLabels: Record<string, string> = { credit: "شارژ", debit: "برداشت/پرداخت", refund: "بازگشت وجه" };

export default async function AdminWalletTransactionsPage() {
  const supabase = await createClient();
  const { data: transactions } = await supabase
    .from("wallet_transactions")
    .select("*, profile:profiles(full_name, phone), order:orders(order_number)")
    .order("created_at", { ascending: false })
    .limit(300);

  const { data: sumRows } = await supabase.from("profiles").select("wallet_balance");
  const totalWallets = (sumRows ?? []).reduce((s, r) => s + (r.wallet_balance ?? 0), 0);

  const orderRevenue = (transactions ?? [])
    .filter((t) => t.type === "debit" && t.related_order_id)
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">تراکنش‌های کیف پول کاربران</h1>
      <p className="text-sm text-gray-500 mb-1">مجموع موجودی فعلی همه کیف‌پول‌ها: <b>{totalWallets.toLocaleString("fa-IR")} تومان</b></p>
      <p className="text-sm text-gray-500 mb-5">مجموع درآمد حاصل از پرداخت سفارش‌ها با کیف پول: <b>{orderRevenue.toLocaleString("fa-IR")} تومان</b></p>

      <div className="admin-card">
        <table className="admin-table">
          <thead><tr><th>کاربر</th><th>نوع</th><th>مبلغ</th><th>مانده پس از تراکنش</th><th>مرتبط با</th><th>شرح</th><th>تاریخ</th></tr></thead>
          <tbody>
            {(transactions ?? []).map((t) => (
              <tr key={t.id}>
                <td>{t.profile?.full_name ?? "—"} <span className="text-xs text-gray-400" dir="ltr">{t.profile?.phone}</span></td>
                <td>{typeLabels[t.type] ?? t.type}</td>
                <td className={t.amount >= 0 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                  {t.amount >= 0 ? "+" : ""}{t.amount.toLocaleString("fa-IR")}
                </td>
                <td>{t.balance_after.toLocaleString("fa-IR")}</td>
                <td className="text-xs">
                  {t.order ? <span className="badge badge-info">سفارش {t.order.order_number}</span> : t.related_auction_id ? <span className="badge badge-warning">مزایده</span> : "—"}
                </td>
                <td className="text-xs text-gray-500">{t.description}</td>
                <td className="text-xs text-gray-500">{new Date(t.created_at).toLocaleString("fa-IR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!transactions || transactions.length === 0) && <p className="text-gray-500 text-sm text-center py-6">تراکنشی ثبت نشده.</p>}
      </div>
    </div>
  );
}