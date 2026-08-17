"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createNotification } from "@/lib/notifications";

interface AuctionInput {
  title: string; description: string; images: string[]; categoryId: string | null; productId: string | null;
  basePrice: number; minIncrement: number; reservePrice: number | null; maxPrice: number | null;
  entryFee: number; entryFeeRefundable: boolean; maxParticipants: number | null; maxBidsPerUser: number | null;
  shippingCost: number; startsAt: string; endsAt: string; autoExtendEnabled: boolean;
  autoExtendTriggerMinutes: number; autoExtendByMinutes: number; maxExtensions: number | null;
  rulesText: string; botsEnabled: boolean; finalPaymentHours: number;
  isSealed: boolean;
}

export async function createAuction(input: AuctionInput) {
  const supabase = await createClient();
  const { error } = await supabase.from("auctions").insert({
    title: input.title, description: input.description, images: input.images,
    category_id: input.categoryId, product_id: input.productId,
    base_price: input.basePrice, min_increment: input.minIncrement, reserve_price: input.reservePrice, max_price: input.maxPrice,
    entry_fee: input.entryFee, entry_fee_refundable: input.entryFeeRefundable,
    max_participants: input.maxParticipants, max_bids_per_user: input.maxBidsPerUser, shipping_cost: input.shippingCost,
    starts_at: input.startsAt, ends_at: input.endsAt,
    auto_extend_enabled: input.autoExtendEnabled, auto_extend_trigger_minutes: input.autoExtendTriggerMinutes, auto_extend_by_minutes: input.autoExtendByMinutes,
    max_extensions: input.maxExtensions, rules_text: input.rulesText, bots_enabled: input.botsEnabled,
    is_sealed: input.isSealed,
    final_payment_hours: input.finalPaymentHours,
    status: new Date(input.startsAt) > new Date() ? "UPCOMING" : "ACTIVE",
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/auctions");
  revalidatePath("/auctions");
  redirect("/admin/auctions");
}

export async function updateAuction(id: string, input: AuctionInput) {
  const supabase = await createClient();
  const { error } = await supabase.from("auctions").update({
    title: input.title, description: input.description, images: input.images,
    category_id: input.categoryId, product_id: input.productId,
    base_price: input.basePrice, min_increment: input.minIncrement, reserve_price: input.reservePrice, max_price: input.maxPrice,
    entry_fee: input.entryFee, entry_fee_refundable: input.entryFeeRefundable,
    max_participants: input.maxParticipants, max_bids_per_user: input.maxBidsPerUser, shipping_cost: input.shippingCost,
    starts_at: input.startsAt, ends_at: input.endsAt,
    auto_extend_enabled: input.autoExtendEnabled, auto_extend_trigger_minutes: input.autoExtendTriggerMinutes, auto_extend_by_minutes: input.autoExtendByMinutes,
    max_extensions: input.maxExtensions, rules_text: input.rulesText, bots_enabled: input.botsEnabled,
    is_sealed: input.isSealed,
    final_payment_hours: input.finalPaymentHours,
  }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/auctions");
  revalidatePath(`/auctions/${id}`);
  redirect("/admin/auctions");
}

export async function extendAuctionManually(id: string, minutes: number) {
  const supabase = await createClient();
  const { data: auction } = await supabase.from("auctions").select("ends_at").eq("id", id).single();
  if (!auction) return { error: "مزایده یافت نشد." };
  const newEnds = new Date(new Date(auction.ends_at).getTime() + minutes * 60000).toISOString();
  const { error } = await supabase.from("auctions").update({ ends_at: newEnds }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/admin/auctions/${id}`);
  return { success: true };
}

export async function cancelAuction(id: string, reason: string) {
  const supabase = await createClient();
  const { data: participants } = await supabase.from("auction_participants").select("user_id").eq("auction_id", id).eq("entry_fee_paid", true);
  const { data: auction } = await supabase.from("auctions").select("title").eq("id", id).single();

  for (const p of participants ?? []) {
    await supabase.rpc("refund_auction_entry_fee", { p_auction_id: id, p_user_id: p.user_id, p_reason: "بازگشت هزینه شرکت به دلیل لغو مزایده" });
    await createNotification(p.user_id, "مزایده لغو شد", `مزایده «${auction?.title ?? ""}» لغو شد. دلیل: ${reason}. هزینه شرکت شما بازگردانده شد.`);
  }

  const { error } = await supabase.from("auctions").update({ status: "CANCELLED" }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/auctions");
  revalidatePath(`/admin/auctions/${id}`);
  return { success: true };
}

export async function deleteAuction(id: string) {
  const supabase = await createClient();
  const { data: participants } = await supabase.from("auction_participants").select("user_id").eq("auction_id", id).eq("entry_fee_paid", true);
  for (const p of participants ?? []) {
    await supabase.rpc("refund_auction_entry_fee", { p_auction_id: id, p_user_id: p.user_id, p_reason: "بازگشت هزینه شرکت — حذف مزایده توسط مدیر" });
  }
  const { error } = await supabase.from("auctions").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/auctions");
  revalidatePath("/auctions");
  return { success: true };
}

export async function deleteAuctionBid(bidId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ابتدا وارد شوید." };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "ADMIN") return { error: "دسترسی غیرمجاز." };

  const { data: bid } = await supabase.from("auction_bids").select("auction_id").eq("id", bidId).single();
  if (!bid) return { error: "پیشنهاد یافت نشد." };

  const { data, error } = await supabase.rpc("admin_delete_auction_bid", { p_bid_id: bidId });
  if (error) return { error: error.message };
  const result = data as { success?: boolean; error?: string };
  if (result?.error) return { error: result.error };

  revalidatePath(`/admin/auctions/${bid.auction_id}`);
  revalidatePath(`/auctions/${bid.auction_id}`);
  return { success: true };
}

