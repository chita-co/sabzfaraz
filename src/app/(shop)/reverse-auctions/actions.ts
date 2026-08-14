"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getReverseAuctionLiveState(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("reverse_auctions").select("status, sold_price, winner_user_id").eq("id", id).single();
  return { status: data?.status ?? "ENDED_UNSOLD", soldPrice: data?.sold_price ?? null, winnerUserId: data?.winner_user_id ?? null };
}

export async function buyReverseAuctionNow(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ابتدا وارد حساب کاربری خود شوید." };

  const { data, error } = await supabase.rpc("buy_reverse_auction", { p_id: id, p_user_id: user.id });
  if (error) return { error: error.message };

  const result = data as { success?: boolean; error?: string; price?: number };
  if (result.error) return result;

  revalidatePath(`/reverse-auctions/${id}`);
  return { success: true, price: result.price };
}