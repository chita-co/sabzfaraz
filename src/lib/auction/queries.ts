import { createClient } from "@/lib/supabase/server";
import { maskBidderName } from "./maskName";

export async function getAuctionHighestBid(auctionId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("auction_bids")
    .select("amount, user_id, is_bot, bot_name, created_at")
    .eq("auction_id", auctionId)
    .order("amount", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export interface BidHistoryItem {
  id: string;
  amount: number;
  createdAt: string;
  displayName: string;
  isMine: boolean;
  viaProxy?: boolean;
}

export async function getAuctionBidHistory(auctionId: string, viewerId: string | null, limit = 30): Promise<BidHistoryItem[]> {
  const supabase = await createClient();
  const { data: auctionMeta } = await supabase.from("auctions").select("is_sealed, status").eq("id", auctionId).single();
  const sealed = !!auctionMeta?.is_sealed;
  const revealed = !sealed || (auctionMeta?.status !== "ACTIVE" && auctionMeta?.status !== "UPCOMING");

  const { data: bids } = await supabase
    .from("auction_bids")
    .select("id, amount, user_id, is_bot, bot_name, via_proxy, created_at")
    .eq("auction_id", auctionId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!bids || bids.length === 0) return [];

  if (sealed && !revealed) {
    // در مزایده‌ی مخفی و فعال، هر کاربر فقط پیشنهاد خودش را می‌بیند
    return bids
      .filter((b) => b.user_id === viewerId)
      .map((b) => ({ id: b.id, amount: b.amount, createdAt: b.created_at, displayName: "پیشنهاد شما", isMine: true }));
  }

  const userIds = [...new Set(bids.filter((b) => !b.is_bot && b.user_id).map((b) => b.user_id as string))];
  let namesMap = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
    namesMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name ?? "کاربر"]));
  }

  return bids.map((b) => ({
    id: b.id,
    amount: b.amount,
    createdAt: b.created_at,
    displayName: b.is_bot ? (b.bot_name ?? "کاربر") : maskBidderName(namesMap.get(b.user_id as string)),
    isMine: b.user_id === viewerId,
    viaProxy: b.via_proxy,
  }));
}