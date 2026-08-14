import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GroupAuctionPaymentClient from "@/components/shop/GroupAuctionPaymentClient";
import Breadcrumb from "@/components/shop/Breadcrumb";
import GrainientBackground from "@/components/backgrounds/GrainientBackground";

export default async function AuctionGroupPayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/auctions/${id}/group-pay`);

  const { data: auction } = await supabase.from("auctions").select("*").eq("id", id).single();
  if (!auction) notFound();

  const { data: group } = await supabase
    .from("auction_bid_groups")
    .select("*")
    .eq("auction_id", id)
    .in("status", ["WON", "PAID"])
    .maybeSingle();
  if (!group) notFound();

  const { data: myMembership } = await supabase
    .from("auction_bid_group_members")
    .select("user_id")
    .eq("group_id", group.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!myMembership) {
    return (
      <>
        <GrainientBackground />
        <div className="mx-auto max-w-xl px-4 py-16 text-center relative z-10">
          <p className="text-white">شما عضو گروه برنده این مزایده نیستید.</p>
        </div>
      </>
    );
  }

  const { data: members } = await supabase
    .from("auction_bid_group_members")
    .select("user_id, pledge_amount, paid_share_amount, payment_status")
    .eq("group_id", group.id);

  const memberIds = (members ?? []).map((m) => m.user_id);
  const { data: profiles } = memberIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", memberIds)
    : { data: [] };
  const nameMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name ?? "کاربر"]));

  const totalPledged = (members ?? []).reduce((s, m) => s + m.pledge_amount, 0);
  const totalAmount = (auction.winner_bid_amount ?? 0) + (auction.shipping_cost ?? 0);

  const isLeader = group.leader_user_id === user.id;
  const { data: addresses } = isLeader
    ? await supabase.from("addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false })
    : { data: [] };

  return (
    <>
      <GrainientBackground />
      <div className="mx-auto max-w-2xl px-4 py-10 relative z-10">
        <Breadcrumb theme="light" items={[{ label: "مزایده‌ها", href: "/auctions" }, { label: auction.title, href: `/auctions/${id}` }, { label: "پرداخت گروهی" }]} />
        <GroupAuctionPaymentClient
          group={{ id: group.id, name: group.name, status: group.status, deliveryAddressId: group.delivery_address_id }}
          auctionTitle={auction.title}
          totalAmount={totalAmount}
          isLeader={isLeader}
          myUserId={user.id}
          addresses={(addresses ?? []).map((a) => ({ id: a.id, fullName: a.full_name, phone: a.phone, province: a.province, city: a.city, addressLine: a.address_line, isDefault: a.is_default }))}
          members={(members ?? []).map((m) => ({
            userId: m.user_id,
            name: nameMap.get(m.user_id) ?? "کاربر",
            pledgeAmount: m.pledge_amount,
            share: totalPledged > 0 ? Math.round((totalAmount * m.pledge_amount) / totalPledged) : 0,
            paymentStatus: m.payment_status as "PENDING" | "PAID",
          }))}
        />
      </div>
    </>
  );
}