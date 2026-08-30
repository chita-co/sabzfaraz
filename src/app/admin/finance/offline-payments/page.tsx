import ConfirmOfflinePaymentButton from "@/components/admin/ConfirmOfflinePaymentButton";
import RejectOfflinePaymentButton from "@/components/admin/RejectOfflinePaymentButton";
import { createClient } from "@/lib/supabase/server";

type PendingOfflineOrder = {
  id: string;
  order_number: string;
  total_amount: number;
  payment_method: string;
  created_at: string;
  profile: { full_name: string | null; phone: string | null } | null;
  bank_account: { bank_name: string | null; card_number: string | null; sheba_number: string | null } | null;
};

export default async function AdminOfflinePaymentsPage() {
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, total_amount, payment_method, created_at, profile:profiles(full_name, phone), bank_account:bank_accounts(bank_name, card_number, sheba_number)")
    .in("payment_method", ["CARD_TO_CARD", "SHEBA"])
    .eq("payment_status", "AWAITING_CONFIRMATION")
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  const list = (orders ?? []) as unknown as PendingOfflineOrder[];

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-5">تأییدیه‌های کارت به کارت / شبا</h1>
      <div className="admin-card">
        {list.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-6">در حال حاضر پرداختی در انتظار تأیید نیست.</p>
        ) : (
          <div className="space-y-3">
            {list.map((o) => (
              <div key={o.id} className="border border-gray-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-gray-800" dir="ltr">{o.order_number}</p>
                  <p className="text-sm text-gray-600">{o.profile?.full_name ?? "—"} — {o.profile?.phone ?? "—"}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    روش: {o.payment_method === "CARD_TO_CARD" ? "کارت به کارت" : "واریز به شبا"} — مبلغ: {o.total_amount.toLocaleString("fa-IR")} تومان
                  </p>
                  <p className="text-xs text-gray-400 mt-1" dir="ltr">
                    {o.bank_account?.bank_name ?? ""}{" "}
                    {o.payment_method === "CARD_TO_CARD" ? o.bank_account?.card_number : o.bank_account?.sheba_number}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(o.created_at).toLocaleString("fa-IR")}</p>
                </div>
                <div className="flex gap-2">
                  <ConfirmOfflinePaymentButton orderId={o.id} />
                  <RejectOfflinePaymentButton orderId={o.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}