import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GalaxyBackground from "@/components/backgrounds/GalaxyBackground";

const statusLabels: Record<string, string> = {
  PENDING_REVIEW: "در حال بررسی", SUPPLY_POSSIBLE: "منتظر پرداخت بیعانه",
  AWAITING_PAYMENT_CONFIRMATION: "پرداخت در انتظار تأیید", PREPARING: "در حال تهیه",
  COMPLETED: "تکمیل‌شده", NOT_POSSIBLE: "غیرقابل تأمین",
};

export default async function MyBulkOrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: requests } = await supabase.from("bulk_order_requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false });

  return (
    <>
      <GalaxyBackground />
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-xl font-bold text-white mb-6">سفارش‌های جمعی من</h1>
        <div className="space-y-3">
          {(requests ?? []).map((r) => (
            <Link key={r.id} href={`/bulk-order/${r.id}`} className="support-ticket-row">
              <div className="support-ticket-icon"><span>📦</span></div>
              <div className="flex-1">
                <p className="font-medium text-gray-800" dir="ltr">{r.request_number}</p>
                <p className="text-xs text-gray-500">{new Date(r.created_at).toLocaleDateString("fa-IR")}</p>
              </div>
              <span className="badge badge-info">{statusLabels[r.status]}</span>
            </Link>
          ))}
          {(!requests || requests.length === 0) && <p className="text-gray-300 text-sm">هنوز درخواستی ثبت نکرده‌اید.</p>}
        </div>
      </div>
    </>
  );
}