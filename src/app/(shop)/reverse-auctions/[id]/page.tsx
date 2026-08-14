import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ReverseAuctionDetailClient from "@/components/shop/ReverseAuctionDetailClient";
import Breadcrumb from "@/components/shop/Breadcrumb";
import GalaxyBackground from "@/components/backgrounds/GalaxyBackground";

export default async function ReverseAuctionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: auction } = await supabase.from("reverse_auctions").select("*").eq("id", id).single();
  if (!auction) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  const isWinner = !!user && auction.winner_user_id === user.id;

  return (
    <>
      <GalaxyBackground />
      <div className="mx-auto max-w-4xl px-4 pt-8">
        <Breadcrumb theme="dark" items={[{ label: "حراج معکوس", href: "/reverse-auctions" }, { label: auction.title }]} />
      </div>
      <ReverseAuctionDetailClient auction={auction} isLoggedIn={!!user} isWinner={isWinner} />
    </>
  );
}