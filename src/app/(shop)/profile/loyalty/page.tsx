import { redirect } from "next/navigation";
import { Coins, Award, Truck, Percent, Star } from "lucide-react";
import { getMyLoyaltyData } from "./actions";

const typeLabels: Record<string, string> = {
  EARNED: "کسب‌شده", REDEEMED: "مصرف‌شده", REFUNDED: "بازگشتی",
  EXPIRED: "منقضی‌شده", BONUS: "پاداش", ADJUSTMENT: "اصلاح",
};

export default async function LoyaltyPage() {
  const data = await getMyLoyaltyData();
  if (!data) redirect("/login");

  const { balance, lifetime, currentTier, nextTier, transactions, upcomingExpiry } = data;
  const progressToNext = nextTier
    ? Math.min(100, Math.round(((lifetime - (currentTier?.min_lifetime_points ?? 0)) / (nextTier.min_lifetime_points - (currentTier?.min_lifetime_points ?? 0))) * 100))
    : 100;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-xl font-bold text-gray-900 mb-6">باشگاه مشتریان</h1>

      <div className="loyalty-hero-card" style={{ borderColor: currentTier?.badge_color }}>
        <div className="flex items-center gap-2 mb-2">
          <Award size={22} style={{ color: currentTier?.badge_color }} />
          <span className="loyalty-tier-name" style={{ color: currentTier?.badge_color }}>{currentTier?.name ?? "عادی"}</span>
        </div>
        <div className="loyalty-balance-display">
          <Coins size={26} className="text-amber-500" />
          <span>{balance.toLocaleString("fa-IR")} <small>امتیاز</small></span>
        </div>

        {nextTier && (
          <div className="mt-4">
            <div className="loyalty-progress-track">
              <div className="loyalty-progress-fill" style={{ width: `${progressToNext}%` }} />
            </div>
            <p className="loyalty-progress-label">
              {(nextTier.min_lifetime_points - lifetime).toLocaleString("fa-IR")} امتیاز تا رسیدن به سطح «{nextTier.name}»
            </p>
          </div>
        )}

        {(currentTier?.free_shipping || currentTier?.permanent_discount_percent > 0 || currentTier?.points_multiplier > 1) && (
          <div className="loyalty-perks">
            {currentTier.points_multiplier > 1 && <span><Star size={13} /> {currentTier.points_multiplier}× امتیاز</span>}
            {currentTier.free_shipping && <span><Truck size={13} /> ارسال رایگان</span>}
            {currentTier.permanent_discount_percent > 0 && <span><Percent size={13} /> {currentTier.permanent_discount_percent}٪ تخفیف دائمی</span>}
          </div>
        )}
      </div>

      {upcomingExpiry && (
        <div className="loyalty-expiry-warning">
          ⏳ {upcomingExpiry.points_remaining?.toLocaleString("fa-IR")} امتیاز تا تاریخ {new Date(upcomingExpiry.expires_at).toLocaleDateString("fa-IR")} اعتبار دارد — فراموش نکنی!
        </div>
      )}

      <h2 className="font-bold text-gray-800 mt-8 mb-4">تاریخچه امتیازها</h2>
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs">
            <tr><th className="p-3 text-right">تاریخ</th><th className="p-3 text-right">نوع</th><th className="p-3 text-right">شرح</th><th className="p-3 text-right">مقدار</th></tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="p-3 text-xs text-gray-500">{new Date(t.created_at).toLocaleDateString("fa-IR")}</td>
                <td className="p-3">{typeLabels[t.type]}</td>
                <td className="p-3 text-xs text-gray-500">{t.description}</td>
                <td className={`p-3 font-bold ${t.points >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {t.points >= 0 ? "+" : ""}{t.points.toLocaleString("fa-IR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {transactions.length === 0 && <p className="text-gray-500 text-sm text-center py-6">هنوز تراکنش امتیازی ثبت نشده.</p>}
      </div>
    </div>
  );
}