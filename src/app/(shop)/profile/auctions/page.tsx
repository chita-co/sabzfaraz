import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Ticket, ShieldCheck } from "lucide-react";
import Breadcrumb from "@/components/shop/Breadcrumb";
import HyperspeedBackground from "@/components/backgrounds/HyperspeedBackground";
import { getReputationTier } from "@/lib/auction/reputation";

const statusLabels: Record<string, string> = {
  UPCOMING: "به‌زودی", ACTIVE: "در حال برگزاری", ENDED: "پایان یافته",
  WINNER_DETERMINED: "برنده مشخص شد", CANCELLED: "لغو شده", FAILED_NO_WINNER: "بدون برنده",
};

export default async function MyAuctionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: participations }, { data: myCodes }, { data: myProfile }] = await Promise.all([
    supabase
      .from("auction_participants")
      .select("auction:auctions(id, title, images, status, ends_at, winner_user_id, winner_bid_amount, winner_payment_status)")
      .eq("user_id", user.id)
      .eq("entry_fee_paid", true)
      .order("created_at", { ascending: false }),
    supabase.from("discount_codes").select("code, value, type, used_count, max_uses, expires_at, related_auction_id").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("profiles").select("auction_reputation_score, is_auction_blacklisted").eq("id", user.id).single(),
  ]);

  const codesByAuction = new Map((myCodes ?? []).map((c) => [c.related_auction_id, c]));
  const tier = getReputationTier(myProfile?.auction_reputation_score ?? 100);

  return (
    <>
      <HyperspeedBackground />
      <div className="mx-auto max-w-3xl px-4 py-10 relative z-10">
        <Breadcrumb theme="dark" items={[{ label: "پروفایل من", href: "/profile" }, { label: "مزایده‌های من" }]} />
        <h1 className="text-xl font-bold text-white mb-4">مزایده‌های من</h1>

        <div className="loyalty-hero-card mb-6" style={{ borderColor: tier.color }}>
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck size={20} style={{ color: tier.color }} />
            <span className="loyalty-tier-name" style={{ color: tier.color }}>اعتبار شرکت در مزایده: {tier.label}</span>
          </div>
          <div className="loyalty-balance-display" style={{ fontSize: 22 }}>{(myProfile?.auction_reputation_score ?? 100).toLocaleString("fa-IR")} <small>امتیاز</small></div>
          {myProfile?.is_auction_blacklisted && (
            <p className="text-xs text-red-500 mt-2">به دلیل عدم پرداخت به‌موقع، امکان شرکت در مزایده‌های جدید موقتاً برای شما محدود شده است.</p>
          )}
        </div>

        <div className="space-y-3">
          {(participations ?? []).map((p, i) => {
            const a = p.auction as unknown as { id: string; title: string; status: string; winner_user_id: string | null; winner_bid_amount: number | null; winner_payment_status: string | null };
            if (!a) return null;
            const isWinner = a.winner_user_id === user.id;
            const code = codesByAuction.get(a.id);
            return (
              <div key={i} className="support-ticket-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}>
                <Link href={`/auctions/${a.id}`} className="flex items-center gap-3">
                  <div className="support-ticket-icon">🔨</div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{a.title}</p>
                    <p className="text-xs text-gray-500">{statusLabels[a.status]}</p>
                  </div>
                  {isWinner && <span className="badge badge-success">برنده شما هستید! {a.winner_payment_status === "PAID" ? "" : "— پرداخت نهایی لازم است"}</span>}
                </Link>
                {code && (
                  <div className="points-earn-badge" style={{ marginRight: 46 }}>
                    <Ticket size={14} /> کد تخفیف شما: <b dir="ltr">{code.code}</b> ({code.value.toLocaleString("fa-IR")}٪ تخفیف)
                    {code.used_count >= code.max_uses ? <span className="badge badge-danger">مصرف‌شده</span> : code.expires_at && new Date(code.expires_at) < new Date() ? <span className="badge badge-danger">منقضی‌شده</span> : <span className="badge badge-success">فعال</span>}
                  </div>
                )}
              </div>
            );
          })}
          {(!participations || participations.length === 0) && <p className="text-gray-300 text-sm">هنوز در مزایده‌ای شرکت نکرده‌اید.</p>}
        </div>
      </div>
    </>
  );
}