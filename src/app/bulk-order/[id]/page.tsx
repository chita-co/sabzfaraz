import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BankAccountDisplay from "@/components/shop/BankAccountDisplay";
import GalaxyBackground from "@/components/backgrounds/GalaxyBackground";
import { CheckCircle2 } from "lucide-react";

const statusLabels: Record<string, string> = {
  PENDING_REVIEW: "در انتظار بررسی", PAYMENT_CONFIRMED: "پرداخت تأیید شد",
  REJECTED: "رد شده", COMPLETED: "تکمیل شده", CANCELLED: "لغو شده",
};

export default async function BulkOrderStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: request } = await supabase
    .from("bulk_order_requests")
    .select("*, bank_account:bank_accounts(*)")
    .eq("id", id).eq("user_id", user.id).single();
  if (!request) notFound();

  return (
    <>
      <GalaxyBackground />
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <CheckCircle2 size={48} className="text-green-400 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-white mb-2">سفارش جمعی شما ثبت شد</h1>
        <p className="text-gray-300 text-sm mb-6">
          شماره پیگیری: <span dir="ltr" className="font-bold text-white">{request.request_number}</span>
          &nbsp;— وضعیت: <span className="text-amber-400">{statusLabels[request.status]}</span>
        </p>

        <div className="bg-white rounded-2xl p-6 text-right mb-6">
          <p className="text-sm text-gray-700 mb-3">مبلغ نهایی تقریبی: <b>{request.total_estimated.toLocaleString("fa-IR")} تومان</b></p>
          {request.bank_account && (
            <BankAccountDisplay account={request.bank_account} mode={request.payment_method === "CARD_TO_CARD" ? "card" : "sheba"} />
          )}
        </div>

        <div className="offline-payment-warning" style={{ textAlign: "right" }}>
          لطفاً مبلغ را کارت به کارت/واریز کرده و از طریق «پشتیبانی» با شماره سفارش <b dir="ltr">{request.request_number}</b> ما را مطلع کنید.
        </div>
      </div>
    </>
  );
}