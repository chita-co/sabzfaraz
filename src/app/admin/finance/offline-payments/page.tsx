import ConfirmOfflinePaymentButton from "@/components/admin/ConfirmOfflinePaymentButton";
import RejectOfflinePaymentButton from "@/components/admin/RejectOfflinePaymentButton";
import BulkAwaitingActions from "@/components/admin/BulkAwaitingActions";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type PendingOfflineOrder = {
  id: string;
  order_number: string;
  total_amount: number;
  payment_method: string;
  created_at: string;
  profile: { full_name: string | null; phone: string | null } | null;
  bank_account: { bank_name: string | null; card_number: string | null; sheba_number: string | null } | null;
};

type PendingBulkPayment = {
  id: string;
  request_id: string;
  request_number: string;
  kind: string;
  method: string;
  amount: number;
  created_at: string;
  full_name: string | null;
  phone: string | null;
};

const KIND_LABEL: Record<string, string> = {
  DEPOSIT: "بیعانه",
  BALANCE: "واریز مانده",
};

async function loadBulkPending(): Promise<PendingBulkPayment[]> {
  const admin = createAdminClient();
  const { data: pays } = await admin
    .from("bulk_order_payments")
    .select("id, request_id, kind, method, amount, created_at")
    .eq("status", "AWAITING_CONFIRMATION")
    .order("created_at", { ascending: true });
  const list = pays ?? [];
  if (list.length === 0) return [];

  const reqIds = [...new Set(list.map((p) => p.request_id as string))];
  const { data: reqs } = await admin
    .from("bulk_order_requests")
    .select("id, request_number, user_id")
    .in("id", reqIds);
  const reqMap = new Map((reqs ?? []).map((r) => [r.id as string, r]));

  const userIds = [...new Set((reqs ?? []).map((r) => r.user_id as string))];
  const { data: profs } = userIds.length
    ? await admin.from("profiles").select("id, full_name, phone").in("id", userIds)
    : { data: [] as { id: string; full_name: string | null; phone: string | null }[] };
  const profMap = new Map((profs ?? []).map((p) => [p.id as string, p]));

  return list.map((p) => {
    const r = reqMap.get(p.request_id as string);
    const pr = r ? profMap.get(r.user_id as string) : undefined;
    return {
      id: p.id as string,
      request_id: p.request_id as string,
      request_number: r?.request_number ?? "—",
      kind: p.kind as string,
      method: p.method as string,
      amount: p.amount as number,
      created_at: p.created_at as string,
      full_name: pr?.full_name ?? null,
      phone: pr?.phone ?? null,
    };
  });
}

export default async function AdminOfflinePaymentsPage() {
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, total_amount, payment_method, created_at, profile:profiles(full_name, phone), bank_account:bank_accounts(bank_name, card_number, sheba_number)")
    .in("payment_method", ["CARD_TO_CARD", "SHEBA"])
    .eq("payment_status", "AWAITING_CONFIRMATION")
    .is("deleted_at", null)
    .or("order_type.is.null,order_type.neq.BULK_ORDER")
    .order("created_at", { ascending: true });

  const list = (orders ?? []) as unknown as PendingOfflineOrder[];
  const bulkList = await loadBulkPending();
  const empty = list.length === 0 && bulkList.length === 0;

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-5">تأییدیه‌های کارت به کارت / شبا</h1>

      {empty && (
        <div className="admin-card">
          <p className="text-gray-500 text-sm text-center py-6">در حال حاضر پرداختی در انتظار تأیید نیست.</p>
        </div>
      )}

      {list.length > 0 && (
        <div className="admin-card mb-5">
          <h2 className="font-bold text-gray-800 mb-3">سفارش‌های عادی</h2>
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
        </div>
      )}

      {bulkList.length > 0 && (
        <div className="admin-card">
          <h2 className="font-bold text-gray-800 mb-3">پرداخت‌های سفارش جمعی</h2>
          <div className="space-y-3">
            {bulkList.map((p) => (
              <div key={p.id} className="border border-gray-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-gray-800" dir="ltr">{p.request_number}</p>
                  <p className="text-sm text-gray-600">{p.full_name ?? "—"} — {p.phone ?? "—"}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    نوع: {KIND_LABEL[p.kind] ?? p.kind} — روش: {p.method === "CARD_TO_CARD" ? "کارت به کارت" : "شبا"} — مبلغ: {p.amount.toLocaleString("fa-IR")} تومان
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(p.created_at).toLocaleString("fa-IR")}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {p.kind === "BALANCE" ? (
                    <BulkAwaitingActions paymentId={p.id} />
                  ) : (
                    <Link href={`/admin/bulk-orders/${p.request_id}`} className="admin-btn admin-btn-primary">
                      بررسی بیعانه در صفحه‌ی سفارش جمعی
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}