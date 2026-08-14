"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getClientIp, hashIp } from "@/lib/analytics/hashIp";
import { headers } from "next/headers";
import { createNotification } from "@/lib/notifications";
import { payEntryFeeFromWallet } from "@/lib/auction/entryFee";

export async function getAuctionLiveState(auctionId: string) {
  const supabase = await createClient();
  const { data: auction } = await supabase
    .from("auctions")
    .select("status, ends_at, is_sealed")
    .eq("id", auctionId)
    .single();

  const sealedActive = !!auction?.is_sealed && (auction?.status === "ACTIVE" || auction?.status === "UPCOMING");

  const { data: highest } = sealedActive
    ? { data: null }
    : await supabase
        .from("auction_bids")
        .select("amount")
        .eq("auction_id", auctionId)
        .order("amount", { ascending: false })
        .limit(1)
        .maybeSingle();

  const { count } = await supabase.from("auction_bids").select("*", { count: "exact", head: true }).eq("auction_id", auctionId);
  const { count: participantCount } = await supabase.from("auction_participants").select("*", { count: "exact", head: true }).eq("auction_id", auctionId).eq("entry_fee_paid", true);

  return {
    status: auction?.status ?? "ENDED",
    endsAt: auction?.ends_at ?? null,
    highestBid: highest?.amount ?? null,
    bidCount: count ?? 0,
    participantCount: participantCount ?? 0,
    isSealed: sealedActive,
  };
}

export async function payAuctionEntryFee(auctionId: string) {
  return payEntryFeeFromWallet(auctionId);
}

export async function placeAuctionBid(auctionId: string, amount: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ابتدا وارد حساب کاربری خود شوید." };

  const { data: auctionMeta } = await supabase.from("auctions").select("is_sealed, title").eq("id", auctionId).single();

  if (auctionMeta?.is_sealed) {
    const { data, error } = await supabase.rpc("place_sealed_bid", { p_auction_id: auctionId, p_user_id: user.id, p_amount: amount });
    if (error) return { error: error.message };
    const result = data as { success?: boolean; error?: string };
    if (result.error) return result;
    revalidatePath(`/auctions/${auctionId}`);
    return { success: true };
  }

  const h = await headers();
  const ip = getClientIp(h as unknown as Headers);
  const ipHash = hashIp(ip);

  const { data, error } = await supabase.rpc("place_auction_bid", {
    p_auction_id: auctionId, p_user_id: user.id, p_amount: amount, p_is_bot: false, p_bot_name: null, p_ip_hash: ipHash,
  });
  if (error) return { error: error.message };

  const result = data as { success?: boolean; error?: string; minRequired?: number; previousHighestUserId?: string | null };
  if (result.error) return result;

  if (result.previousHighestUserId && result.previousHighestUserId !== user.id) {
    await createNotification(
      result.previousHighestUserId,
      "پیشنهاد شما رد شد",
      `کاربر دیگری در مزایده «${auctionMeta?.title ?? ""}» پیشنهاد بالاتری ثبت کرد. برای ادامه رقابت، پیشنهاد جدید ثبت کنید.`
    );
  }

  revalidatePath(`/auctions/${auctionId}`);
  return { success: true };
}

export async function setAuctionProxyBid(auctionId: string, maxAmount: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ابتدا وارد حساب کاربری خود شوید." };

  const { data: auctionMeta } = await supabase.from("auctions").select("is_sealed, title").eq("id", auctionId).single();
  if (auctionMeta?.is_sealed) return { error: "پیشنهاد خودکار برای مزایده‌های مخفی در دسترس نیست." };

  const { data: prevHighest } = await supabase.from("auction_bids").select("user_id").eq("auction_id", auctionId).order("amount", { ascending: false }).limit(1).maybeSingle();

  const { data, error } = await supabase.rpc("set_proxy_max_bid", { p_auction_id: auctionId, p_user_id: user.id, p_max_amount: maxAmount });
  if (error) return { error: error.message };

  const result = data as { success?: boolean; error?: string; minRequired?: number };
  if (result.error) return result;

  if (prevHighest?.user_id && prevHighest.user_id !== user.id) {
    const { data: newHighest } = await supabase.from("auction_bids").select("user_id").eq("auction_id", auctionId).order("amount", { ascending: false }).limit(1).maybeSingle();
    if (newHighest?.user_id !== prevHighest.user_id) {
      await createNotification(
        prevHighest.user_id,
        "پیشنهاد شما رد شد",
        `در مزایده «${auctionMeta?.title ?? ""}» پیشنهاد خودکار کاربر دیگری از شما پیشی گرفت.`
      );
    }
  }

  revalidatePath(`/auctions/${auctionId}`);
  return { success: true };
}

export async function toggleAuctionFavorite(auctionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ابتدا وارد شوید.", needsLogin: true };

  const { data: existing } = await supabase.from("auction_favorites").select("id").eq("auction_id", auctionId).eq("user_id", user.id).maybeSingle();
  if (existing) {
    await supabase.from("auction_favorites").delete().eq("id", existing.id);
    return { added: false };
  }
  await supabase.from("auction_favorites").insert({ auction_id: auctionId, user_id: user.id });
  return { added: true };
}