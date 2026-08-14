import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TrendingDown, Gavel } from "lucide-react";
import Breadcrumb from "@/components/shop/Breadcrumb";
import GalaxyBackground from "@/components/backgrounds/GalaxyBackground";
import ReverseAuctionCard from "@/components/shop/ReverseAuctionCard";

export const metadata = { title: "حراج معکوس سبزفراز" };

export default async function ReverseAuctionsListPage() {
  const supabase = await createClient();
  const { data: auctions } = await supabase
    .from("reverse_auctions")
    .select("id, title, images, starting_price, floor_price, drop_amount, drop_interval_minutes, starts_at, status, sold_price")
    .in("status", ["ACTIVE", "UPCOMING"])
    .order("starts_at", { ascending: true });

  return (
    <>
      <GalaxyBackground />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Breadcrumb theme="dark" items={[{ label: "حراج معکوس" }]} />
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <TrendingDown size={22} className="text-amber-400" />
            <h1 className="text-xl font-bold text-white">حراج معکوس — قیمت هر لحظه پایین‌تر می‌رود</h1>
          </div>
          <Link href="/auctions" className="order-tab flex items-center gap-1"><Gavel size={14} /> مزایده‌های پیشنهادی</Link>
        </div>
        <p className="text-gray-300 text-sm mb-6">قیمت این کالاها به‌تدریج کاهش می‌یابد؛ اولین کسی که دکمه خرید را بزند، کالا را با همان قیمت لحظه‌ای می‌برد.</p>

        {auctions && auctions.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {auctions.map((a) => (
              <ReverseAuctionCard
                key={a.id}
                id={a.id}
                title={a.title}
                image={a.images?.[0] ?? null}
                status={a.status}
                startingPrice={a.starting_price}
                floorPrice={a.floor_price}
                dropAmount={a.drop_amount}
                dropIntervalMinutes={a.drop_interval_minutes}
                startsAt={a.starts_at}
                soldPrice={a.sold_price}
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-300">در حال حاضر کالایی در حراج معکوس وجود ندارد.</p>
        )}
      </div>
    </>
  );
}