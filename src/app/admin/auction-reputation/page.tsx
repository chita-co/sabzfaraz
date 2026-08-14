import { createClient } from "@/lib/supabase/server";
import AuctionReputationManager from "@/components/admin/AuctionReputationManager";

export default async function AdminAuctionReputationPage() {
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, phone, auction_reputation_score, auction_payment_failures, is_auction_blacklisted")
    .or("auction_reputation_score.neq.100,auction_payment_failures.gt.0,is_auction_blacklisted.eq.true")
    .order("is_auction_blacklisted", { ascending: false })
    .order("auction_payment_failures", { ascending: false });

  return <AuctionReputationManager users={profiles ?? []} />;
}