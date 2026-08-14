"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createNotification } from "@/lib/notifications";

interface ReverseAuctionInput {
  title: string; description: string; images: string[]; categoryId: string | null; productId: string | null;
  startingPrice: number; floorPrice: number; dropAmount: number; dropIntervalMinutes: number;
  shippingCost: number; startsAt: string; endsAt: string | null; rulesText: string;
}

export async function createReverseAuction(input: ReverseAuctionInput) {
  const supabase = await createClient();
  const { error } = await supabase.from("reverse_auctions").insert({
    title: input.title, description: input.description, images: input.images,
    category_id: input.categoryId, product_id: input.productId,
    starting_price: input.startingPrice, floor_price: input.floorPrice,
    drop_amount: input.dropAmount, drop_interval_minutes: input.dropIntervalMinutes,
    shipping_cost: input.shippingCost, starts_at: input.startsAt, ends_at: input.endsAt,
    rules_text: input.rulesText,
    status: new Date(input.startsAt) > new Date() ? "UPCOMING" : "ACTIVE",
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/reverse-auctions");
  revalidatePath("/reverse-auctions");
  redirect("/admin/reverse-auctions");
}

export async function updateReverseAuction(id: string, input: ReverseAuctionInput) {
  const supabase = await createClient();
  const { error } = await supabase.from("reverse_auctions").update({
    title: input.title, description: input.description, images: input.images,
    category_id: input.categoryId, product_id: input.productId,
    starting_price: input.startingPrice, floor_price: input.floorPrice,
    drop_amount: input.dropAmount, drop_interval_minutes: input.dropIntervalMinutes,
    shipping_cost: input.shippingCost, starts_at: input.startsAt, ends_at: input.endsAt,
    rules_text: input.rulesText,
  }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/reverse-auctions");
  revalidatePath(`/reverse-auctions/${id}`);
  redirect("/admin/reverse-auctions");
}

export async function cancelReverseAuction(id: string) {
  const supabase = await createClient();
  const { data: auction } = await supabase.from("reverse_auctions").select("status, winner_user_id, title").eq("id", id).single();
  if (!auction) return { error: "یافت نشد." };
  if (auction.status === "SOLD" && auction.winner_user_id) {
    await createNotification(auction.winner_user_id, "خرید لغو شد", `خرید شما از حراج معکوس «${auction.title}» توسط فروشگاه لغو شد.`);
  }
  const { error } = await supabase.from("reverse_auctions").update({ status: "CANCELLED" }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/reverse-auctions");
  return { success: true };
}