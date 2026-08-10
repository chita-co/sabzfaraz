"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export interface StoreItemInput {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface MarketItemInput {
  name: string;
  quantity: number;
  minPrice: number | null;
  maxPrice: number | null;
}

export async function searchStoreProducts(query: string) {
  if (!query || query.trim().length < 2) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("id, name, price, discount_price")
    .eq("is_active", true)
    .ilike("name", `%${query.trim()}%`)
    .limit(8);
  return (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    unitPrice: p.discount_price ?? p.price,
  }));
}

export async function submitBulkOrderRequest(storeItems: StoreItemInput[], marketItems: MarketItemInput[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "برای ثبت درخواست باید وارد شوید." };

  const validStoreItems = storeItems.filter((i) => i.productId && i.quantity > 0);
  const validMarketItems = marketItems.filter((i) => i.name.trim() && i.quantity > 0);

  if (validStoreItems.length === 0 && validMarketItems.length === 0) {
    return { error: "حداقل یک کالا (از فروشگاه یا از بازار) اضافه کنید." };
  }

  const requestNumber = `BLK-${Date.now().toString().slice(-8)}`;

  const { data: created, error } = await supabase.from("bulk_order_requests").insert({
    request_number: requestNumber,
    user_id: user.id,
    store_items: validStoreItems,
    market_items: validMarketItems,
  }).select("id").single();

  if (error || !created) return { error: "خطا در ثبت درخواست: " + (error?.message ?? "") };

  redirect(`/bulk-order/${created.id}`);
}