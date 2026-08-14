"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/notifications";
import { issueWinnerDiscountCode } from "@/lib/auction/discountCode";

export interface GroupMemberInfo {
  userId: string;
  name: string;
  pledgeAmount: number;
  share: number;
  paymentStatus: "PENDING" | "PAID";
  isLeader: boolean;
  isMe: boolean;
}

export interface GroupStateResult {
  openGroups: { id: string; name: string; leaderName: string; totalPledged: number; memberCount: number }[];
  myGroup: {
    id: string;
    name: string;
    status: string;
    isLeader: boolean;
    totalPledged: number;
    members: GroupMemberInfo[];
  } | null;
}

export async function getAuctionGroupState(auctionId: string): Promise<GroupStateResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: groups } = await supabase
    .from("auction_bid_groups")
    .select("id, name, status, leader_user_id")
    .eq("auction_id", auctionId)
    .eq("status", "OPEN");

  const groupIds = (groups ?? []).map((g) => g.id);
  const { data: allMembers } = groupIds.length
    ? await supabase.from("auction_bid_group_members").select("group_id, pledge_amount, user_id").in("group_id", groupIds)
    : { data: [] };

  const leaderIds = [...new Set((groups ?? []).map((g) => g.leader_user_id))];
  const { data: leaderProfiles } = leaderIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", leaderIds)
    : { data: [] };
  const leaderNameMap = new Map((leaderProfiles ?? []).map((p) => [p.id, p.full_name ?? "کاربر"]));

  const openGroups = (groups ?? []).map((g) => {
    const members = (allMembers ?? []).filter((m) => m.group_id === g.id);
    return {
      id: g.id,
      name: g.name,
      leaderName: leaderNameMap.get(g.leader_user_id) ?? "کاربر",
      totalPledged: members.reduce((s, m) => s + m.pledge_amount, 0),
      memberCount: members.length,
    };
  });

  let myGroup: GroupStateResult["myGroup"] = null;
  if (user) {
    const { data: myMembership } = await supabase.from("auction_bid_group_members").select("group_id").eq("user_id", user.id);
    const myGroupIds = (myMembership ?? []).map((m) => m.group_id);

    const { data: myGroupRow } = myGroupIds.length
      ? await supabase
          .from("auction_bid_groups")
          .select("*")
          .eq("auction_id", auctionId)
          .in("id", myGroupIds)
          .in("status", ["OPEN", "LOCKED", "WON", "PAID"])
          .maybeSingle()
      : { data: null };

    if (myGroupRow) {
      const { data: members } = await supabase
        .from("auction_bid_group_members")
        .select("user_id, pledge_amount, paid_share_amount, payment_status")
        .eq("group_id", myGroupRow.id);

      const memberIds = (members ?? []).map((m) => m.user_id);
      const { data: memberProfiles } = memberIds.length
        ? await supabase.from("profiles").select("id, full_name").in("id", memberIds)
        : { data: [] };
      const memberNameMap = new Map((memberProfiles ?? []).map((p) => [p.id, p.full_name ?? "کاربر"]));

      const totalPledged = (members ?? []).reduce((s, m) => s + m.pledge_amount, 0);
      const { data: auction } = await supabase.from("auctions").select("winner_bid_amount, shipping_cost").eq("id", auctionId).single();
      const totalAmount = (auction?.winner_bid_amount ?? 0) + (auction?.shipping_cost ?? 0);

      myGroup = {
        id: myGroupRow.id,
        name: myGroupRow.name,
        status: myGroupRow.status,
        isLeader: myGroupRow.leader_user_id === user.id,
        totalPledged,
        members: (members ?? []).map((m) => ({
          userId: m.user_id,
          name: memberNameMap.get(m.user_id) ?? "کاربر",
          pledgeAmount: m.pledge_amount,
          share: totalPledged > 0 && totalAmount > 0 ? Math.round((totalAmount * m.pledge_amount) / totalPledged) : 0,
          paymentStatus: m.payment_status,
          isLeader: m.user_id === myGroupRow.leader_user_id,
          isMe: m.user_id === user.id,
        })),
      };
    }
  }

  return { openGroups, myGroup };
}

export async function createBidGroup(auctionId: string, name: string, pledgeAmount: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ابتدا وارد حساب کاربری خود شوید." };
  if (!name.trim()) return { error: "نام گروه را وارد کنید." };

  const { data, error } = await supabase.rpc("create_auction_bid_group", {
    p_auction_id: auctionId, p_leader_id: user.id, p_name: name.trim(), p_pledge_amount: pledgeAmount,
  });
  if (error) return { error: error.message };
  const result = data as { success?: boolean; error?: string; groupId?: string };
  if (result.error) return result;
  revalidatePath(`/auctions/${auctionId}`);
  return { success: true, groupId: result.groupId };
}

export async function joinBidGroup(groupId: string, auctionId: string, pledgeAmount: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ابتدا وارد حساب کاربری خود شوید." };

  const { data, error } = await supabase.rpc("join_auction_bid_group", {
    p_group_id: groupId, p_user_id: user.id, p_pledge_amount: pledgeAmount,
  });
  if (error) return { error: error.message };
  const result = data as { success?: boolean; error?: string };
  if (result.error) return result;
  revalidatePath(`/auctions/${auctionId}`);
  return { success: true };
}

export async function leaveBidGroup(groupId: string, auctionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ابتدا وارد حساب کاربری خود شوید." };
  const { data, error } = await supabase.rpc("leave_auction_bid_group", { p_group_id: groupId, p_user_id: user.id });
  if (error) return { error: error.message };
  const result = data as { success?: boolean; error?: string };
  if (result.error) return result;
  revalidatePath(`/auctions/${auctionId}`);
  return { success: true };
}

export async function cancelBidGroup(groupId: string, auctionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ابتدا وارد حساب کاربری خود شوید." };
  const { data, error } = await supabase.rpc("cancel_auction_bid_group", { p_group_id: groupId, p_user_id: user.id });
  if (error) return { error: error.message };
  const result = data as { success?: boolean; error?: string };
  if (result.error) return result;
  revalidatePath(`/auctions/${auctionId}`);
  return { success: true };
}

export async function placeGroupBid(groupId: string, auctionId: string, amount: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ابتدا وارد حساب کاربری خود شوید." };

  const { data: auctionMeta } = await supabase.from("auctions").select("title").eq("id", auctionId).single();
  const { data: prevHighest } = await supabase.from("auction_bids").select("user_id").eq("auction_id", auctionId).order("amount", { ascending: false }).limit(1).maybeSingle();

  const { data, error } = await supabase.rpc("place_auction_bid", {
    p_auction_id: auctionId, p_user_id: user.id, p_amount: amount,
    p_is_bot: false, p_bot_name: null, p_ip_hash: null, p_group_id: groupId,
  });
  if (error) return { error: error.message };
  const result = data as { success?: boolean; error?: string; minRequired?: number };
  if (result.error) return result;

  if (prevHighest?.user_id && prevHighest.user_id !== user.id) {
    await createNotification(prevHighest.user_id, "پیشنهاد شما رد شد", `یک گروه در مزایده «${auctionMeta?.title ?? ""}» پیشنهاد بالاتری ثبت کرد.`);
  }

  revalidatePath(`/auctions/${auctionId}`);
  return { success: true };
}

export async function setGroupDeliveryAddress(groupId: string, addressId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ابتدا وارد حساب کاربری خود شوید." };
  const { data, error } = await supabase.rpc("set_group_delivery_address", { p_group_id: groupId, p_user_id: user.id, p_address_id: addressId });
  if (error) return { error: error.message };
  return data as { success?: boolean; error?: string };
}

export async function payMyGroupShare(groupId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ابتدا وارد حساب کاربری خود شوید." };

  const { data: payData, error: payError } = await supabase.rpc("pay_group_share", { p_group_id: groupId, p_user_id: user.id });
  if (payError) return { error: payError.message };
  const payResult = payData as { success?: boolean; error?: string; required?: number; balance?: number; share?: number };
  if (payResult.error === "insufficient_balance") {
    return { error: `موجودی کیف پول شما کافی نیست. سهم شما ${(payResult.required ?? 0).toLocaleString("fa-IR")} تومان است.` };
  }
  if (payResult.error) return { error: payResult.error };

  const { data: finalizeData, error: finalizeError } = await supabase.rpc("try_finalize_group_order", { p_group_id: groupId });
  if (finalizeError) return { error: finalizeError.message };
  const finalizeResult = finalizeData as { success?: boolean; complete?: boolean; orderId?: string };

  if (finalizeResult.complete && finalizeResult.orderId) {
    const { data: group } = await supabase.from("auction_bid_groups").select("auction_id, leader_user_id").eq("id", groupId).single();
    if (group) {
      const discountCode = await issueWinnerDiscountCode(group.leader_user_id, group.auction_id);
      const { data: members } = await supabase.from("auction_bid_group_members").select("user_id").eq("group_id", groupId);
      for (const m of members ?? []) {
        await createNotification(
          m.user_id,
          "خرید گروهی نهایی شد ✅",
          `تمام اعضای گروه سهم خود را پرداخت کردند و سفارش گروهی شما ثبت شد.${discountCode && m.user_id === group.leader_user_id ? ` کد تخفیف: ${discountCode}` : ""}`
        );
      }
    }
    return { success: true, complete: true, orderId: finalizeResult.orderId };
  }

  return { success: true, complete: false };
}