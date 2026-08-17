import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AuctionDetailClient from "@/components/shop/AuctionDetailClient";
import { getAuctionBidHistory } from "@/lib/auction/queries";
import Breadcrumb from "@/components/shop/Breadcrumb";
import GalaxyBackground from "@/components/backgrounds/GalaxyBackground";

// جلوگیری از هرگونه کش‌شدن این صفحه توسط Next.js — همیشه وضعیت تازه از دیتابیس خوانده شود
export const dynamic = "force-dynamic";

export default async function AuctionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: auction } = await supabase.from("auctions").select("*").eq("id", id).single();
  if (!auction) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  const sealedActive = auction.is_sealed && (auction.status === "ACTIVE" || auction.status === "UPCOMING");

  let myParticipant = null;
  let myWalletBalance = 0;
  let isFavorited = false;
  let myProxyMax: number | null = null;
  let isBlacklisted = false;
  if (user) {
    const [{ data: participant }, { data: profile }, { data: fav }, { data: proxy }] = await Promise.all([
      supabase.from("auction_participants").select("entry_fee_paid").eq("auction_id", id).eq("user_id", user.id).maybeSingle(),
      supabase.from("profiles").select("wallet_balance, is_auction_blacklisted").eq("id", user.id).single(),
      supabase.from("auction_favorites").select("id").eq("auction_id", id).eq("user_id", user.id).maybeSingle(),
      supabase.from("auction_proxy_bids").select("max_amount").eq("auction_id", id).eq("user_id", user.id).maybeSingle(),
    ]);
    myParticipant = participant;
    myWalletBalance = profile?.wallet_balance ?? 0;
    isFavorited = !!fav;
    myProxyMax = proxy?.max_amount ?? null;
    isBlacklisted = profile?.is_auction_blacklisted ?? false;
  }

  const { data: highest } = sealedActive
    ? { data: null }
    : await supabase.from("auction_bids").select("amount").eq("auction_id", id).order("amount", { ascending: false }).limit(1).maybeSingle();

  const { count: bidCount } = await supabase.from("auction_bids").select("*", { count: "exact", head: true }).eq("auction_id", id);
  const { count: participantCount } = await supabase.from("auction_participants").select("*", { count: "exact", head: true }).eq("auction_id", id).eq("entry_fee_paid", true);
  const bidHistory = await getAuctionBidHistory(id, user?.id ?? null);

  return (
    <>
      <GalaxyBackground />
      <div className="mx-auto max-w-4xl px-4 pt-8">
        <Breadcrumb theme="dark" items={[{ label: "مزایده‌ها", href: "/auctions" }, { label: auction.title }]} />
      </div>
      <AuctionDetailClient
        key={auction.id}
        auction={auction}
        isLoggedIn={!!user}
        entryFeePaid={!!myParticipant?.entry_fee_paid}
        myWalletBalance={myWalletBalance}
        myProxyMax={myProxyMax}
        isBlacklisted={isBlacklisted}
        initialHighestBid={highest?.amount ?? null}
        initialBidCount={bidCount ?? 0}
        initialParticipantCount={participantCount ?? 0}
        initialBidHistory={bidHistory}
        isFavorited={isFavorited}
      />
    </>
  );
}