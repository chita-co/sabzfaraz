import { createClient } from "@/lib/supabase/server";
import { CheckCircle2, XCircle } from "lucide-react";

export default async function AdminWalletTopupsHistoryPage() {
  const supabase = await createClient();
  const { data: requests } = await supabase
    .from("wallet_topup_requests")
    .select("*, profile:profiles(full_name, phone), bank_account:bank_accounts(bank_name)")
    .in("status", ["APPROVED", "REJECTED"])
    .order("reviewed_at", { ascending: false })
    .limit(300);

  const approved = (requests ?? []).filter((r) => r.status === "APPROVED");
  const totalApproved = approved.reduce((s, r) => s + r.amount, 0);

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">تاریخچه شارژهای بررسی‌شده کیف پول</h1>
      <p className="text-sm text-gray-500 mb-5">
        مجموع مبلغ شارژهای تأییدشده: <b>{totalApproved.toLocaleString("fa-IR")} تومان</b> در {approved.length.toLocaleString("fa-IR")} تراکنش
      </p>

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>کاربر</th><th>مبلغ</th><th>روش</th><th>شناسه پیگیری / حساب مقصد</th>
              <th>تاریخ درخواست</th><th>تاریخ بررسی</th><th>نتیجه</th>
            </tr>
          </thead>
          <tbody>
            {(requests ?? []).map((r) => (
              <tr key={r.id}>
                <td>{r.profile?.full_name ?? "—"} <span className="text-xs text-gray-400" dir="ltr">{r.profile?.phone}</span></td>
                <td>{r.amount.toLocaleString("fa-IR")} تومان</td>
                <td>{r.method === "ONLINE" ? "درگاه آنلاین" : r.method === "CARD_TO_CARD" ? "کارت به کارت" : "شبا"}</td>
                <td className="text-xs text-gray-500" dir="ltr">
                  {r.method === "ONLINE" ? (r.sep_ref_num || r.sep_token || "—") : (r.bank_account?.bank_name ?? "—")}
                </td>
                <td className="text-xs text-gray-500">{new Date(r.created_at).toLocaleString("fa-IR")}</td>
                <td className="text-xs text-gray-500">{r.reviewed_at ? new Date(r.reviewed_at).toLocaleString("fa-IR") : "—"}</td>
                <td>
                  {r.status === "APPROVED" ? (
                    <span className="badge badge-success" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><CheckCircle2 size={12} /> تأیید شده</span>
                  ) : (
                    <span className="badge badge-danger" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><XCircle size={12} /> رد شده</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!requests || requests.length === 0) && <p className="text-gray-500 text-sm text-center py-6">هنوز درخواستی بررسی نشده است.</p>}
      </div>
    </div>
  );
}