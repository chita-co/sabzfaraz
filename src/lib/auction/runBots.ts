import { createAdminClient } from "@/lib/supabase/admin";

export async function runAuctionBotsOnce() {
  const admin = createAdminClient();
  const { data: botSettings } = await admin.from("auction_bot_settings").select("*").eq("id", 1).single();
  if (!botSettings?.enabled_global) return { status: "bots-disabled", bidsPlaced: 0 };

  const { data: auctions } = await admin.from("auctions").select("*").eq("status", "ACTIVE").eq("bots_enabled", true);
  let bidsPlaced = 0;

  for (const auction of auctions ?? []) {
    const { data: lastBid } = await admin
      .from("auction_bids")
      .select("amount, created_at, is_bot")
      .eq("auction_id", auction.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (botSettings.stop_after_real_bid && lastBid && !lastBid.is_bot) continue;

    const { count: botBidCount } = await admin.from("auction_bids").select("*", { count: "exact", head: true }).eq("auction_id", auction.id).eq("is_bot", true);
    if ((botBidCount ?? 0) >= botSettings.bots_per_auction * 6) continue;

    const minutesSinceLastBid = lastBid ? (Date.now() - new Date(lastBid.created_at).getTime()) / 60000 : 999;
    const randomInterval = botSettings.min_interval_minutes + Math.random() * (botSettings.max_interval_minutes - botSettings.min_interval_minutes);
    if (minutesSinceLastBid < randomInterval) continue;

    const nextAmount = (lastBid?.amount ?? auction.base_price) + auction.min_increment + Math.round(Math.random() * 2 * auction.min_increment);
    if (auction.max_price && nextAmount > auction.max_price) continue;

    const botName = botSettings.bot_names[Math.floor(Math.random() * botSettings.bot_names.length)] ?? "کاربر مزایده";

    const { data: result } = await admin.rpc("place_auction_bid", {
      p_auction_id: auction.id,
      p_user_id: null,
      p_amount: lastBid ? nextAmount : Math.max(auction.base_price, nextAmount),
      p_is_bot: true,
      p_bot_name: botName,
      p_ip_hash: null,
    });

    if ((result as { success?: boolean })?.success) bidsPlaced++;
  }

  return { status: "ok", bidsPlaced };
}