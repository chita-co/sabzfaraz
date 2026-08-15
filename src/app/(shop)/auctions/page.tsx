import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Gavel, Clock, Users, TrendingDown } from "lucide-react";
import Breadcrumb from "@/components/shop/Breadcrumb";
import GalaxyBackground from "@/components/backgrounds/GalaxyBackground";

export const metadata = { title: "مزایده‌های سبزفراز" };

export default async function AuctionsListPage() {
  const supabase = await createClient();
  const { data: auctions } = await supabase
    .from("auctions")
    .select("id, title, images, base_price, ends_at, status")
    .in("status", ["ACTIVE", "UPCOMING"])
    .order("ends_at", { ascending: true });

  const { data: pastAuctions } = await supabase
    .from("auctions")
    .select("id, title, images, winner_bid_amount, status")
    .in("status", ["WINNER_DETERMINED", "FAILED_NO_WINNER"])
    .order("created_at", { ascending: false })
    .limit(12);

  return (
    <>
      <GalaxyBackground />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Breadcrumb theme="dark" items={[{ label: "مزایده‌ها" }]} />
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
  <div className="flex items-center gap-2">
    <Gavel size={22} className="text-amber-400" />
    <h1 className="text-xl font-bold text-white">مزایده‌های فعال و آینده</h1>
  </div>
  <Link href="/reverse-auctions" className="order-tab flex items-center gap-1" style={{ color: "#000" }}><TrendingDown size={14} /> حراج معکوس</Link>
</div>

        {auctions && auctions.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 mb-12">
            {auctions.map((a) => (
              <Link key={a.id} href={`/auctions/${a.id}`} className="group block overflow-hidden rounded-2xl border border-white/10 bg-white/5 hover:border-amber-400 transition">
                <div className="relative aspect-square bg-gray-800">
                  {a.images?.[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.images[0]} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                  )}
                  <span className={`absolute top-2 right-2 badge ${a.status === "ACTIVE" ? "badge-success" : "badge-info"}`}>
                    {a.status === "ACTIVE" ? "در حال برگزاری" : "به‌زودی"}
                  </span>
                </div>
                <div className="p-3">
                  <p className="text-sm text-white line-clamp-2 mb-2">{a.title}</p>
                  <p className="text-xs text-gray-300 flex items-center gap-1"><Clock size={12} /> پایان: {new Date(a.ends_at).toLocaleDateString("fa-IR")}</p>
                  <p className="text-amber-400 font-bold text-sm mt-1">از {a.base_price.toLocaleString("fa-IR")} تومان</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-300 mb-12">در حال حاضر مزایده‌ی فعالی وجود ندارد.</p>
        )}

        {pastAuctions && pastAuctions.length > 0 && (
          <>
            <h2 className="section-title flex items-center gap-2"><Users size={18} /> مزایده‌های پایان‌یافته</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {pastAuctions.map((a) => (
                <div key={a.id} className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden opacity-70">
                  <div className="relative aspect-square bg-gray-800">
                    {a.images?.[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.images[0]} alt={a.title} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm text-white line-clamp-2 mb-1">{a.title}</p>
                    <p className="text-xs text-gray-400">{a.status === "FAILED_NO_WINNER" ? "بدون برنده" : `فروخته شد: ${a.winner_bid_amount?.toLocaleString("fa-IR")} تومان`}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}