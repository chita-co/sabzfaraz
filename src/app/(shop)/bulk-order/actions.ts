"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
  weightGrams: number | null; // وزن هر عدد به گرم
  finalUnitPrice?: number | null;
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
  return (data ?? []).map((p) => ({ id: p.id, name: p.name, unitPrice: p.discount_price ?? p.price }));
}

// روش‌های ارسال فعال (همان جدول روش‌های ارسال سفارش عادی)
export async function listBulkShippingMethods() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("shipping_methods")
    .select("id, name")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  return (data ?? []).map((m) => ({ id: m.id as string, name: m.name as string }));
}

type QuoteInput = {
  storeItems: { productId: string; quantity: number }[];
  marketItems: { quantity: number; weightGrams: number | null }[];
};

export type ShippingQuote = {
  error: string | null;
  cost: number;
  weight: number;
  missingWeight: boolean;
};

// محاسبه‌ی هزینه‌ی ارسال با همان منطق سفارش عادی (بازه‌ی وزنی، و در صورت خارج بودن از بازه، آخرین بازه)
export async function quoteBulkShipping(methodId: string, input: QuoteInput): Promise<ShippingQuote> {
  const admin = createAdminClient();
  const { data: method } = await admin
    .from("shipping_methods")
    .select("id")
    .eq("id", methodId)
    .eq("is_active", true)
    .maybeSingle();
  if (!method) return { error: "روش ارسال انتخابی معتبر نیست.", cost: 0, weight: 0, missingWeight: false };

  let weight = 0;
  const ids = [...new Set(input.storeItems.map((i) => i.productId))];
  if (ids.length > 0) {
    const { data: products } = await admin.from("products").select("id, weight_grams").in("id", ids);
    const weightMap = new Map((products ?? []).map((p) => [p.id as string, Number(p.weight_grams ?? 0)]));
    for (const it of input.storeItems) weight += (weightMap.get(it.productId) ?? 0) * it.quantity;
  }

  let missingWeight = false;
  for (const it of input.marketItems) {
    if (!it.weightGrams || it.weightGrams <= 0) {
      missingWeight = true;
      continue;
    }
    weight += it.weightGrams * it.quantity;
  }

  const { data: tiers } = await admin
    .from("shipping_weight_tiers")
    .select("min_weight_grams, max_weight_grams, cost")
    .eq("method_id", methodId)
    .order("min_weight_grams", { ascending: true });
  const list = tiers ?? [];
  if (list.length === 0) {
    return { error: "هزینه‌ی این روش ارسال تعریف نشده است.", cost: 0, weight, missingWeight };
  }

  const matched = list.find(
    (t) => weight >= Number(t.min_weight_grams) && weight <= Number(t.max_weight_grams)
  );
  return {
    error: null,
    cost: Number((matched ?? list[list.length - 1]).cost),
    weight,
    missingWeight,
  };
}

export async function submitBulkOrderRequest(
  storeItems: StoreItemInput[],
  marketItems: MarketItemInput[],
  addressId: string,
  shippingMethodId: string | null
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "برای ثبت درخواست باید وارد شوید." };

  if (!addressId) return { error: "لطفاً یک آدرس تحویل انتخاب کنید." };
  const { data: address } = await supabase
    .from("addresses")
    .select("id")
    .eq("id", addressId)
    .eq("user_id", user.id)
    .single();
  if (!address) return { error: "آدرس انتخابی معتبر نیست." };

  if (!shippingMethodId) return { error: "لطفاً نحوه‌ی ارسال را انتخاب کنید." };

  const validStoreItems = storeItems.filter((i) => i.productId && i.quantity > 0);
  const validMarketItems = marketItems.filter((i) => i.name.trim() && i.quantity > 0);
  if (validStoreItems.length === 0 && validMarketItems.length === 0) {
    return { error: "حداقل یک کالا (از فروشگاه یا از بازار) اضافه کنید." };
  }
  if (validMarketItems.some((i) => !i.weightGrams || i.weightGrams <= 0)) {
    return { error: "وزن تقریبی هر کالای بازار را به گرم وارد کنید." };
  }

  const quote = await quoteBulkShipping(shippingMethodId, {
    storeItems: validStoreItems.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    marketItems: validMarketItems.map((i) => ({ quantity: i.quantity, weightGrams: i.weightGrams })),
  });
  if (quote.error) return { error: quote.error };

  const admin = createAdminClient();
  const { data: method } = await admin
    .from("shipping_methods")
    .select("name")
    .eq("id", shippingMethodId)
    .single();

  const requestNumber = `BLK-${Date.now().toString().slice(-8)}`;

  const { data: created, error } = await supabase
    .from("bulk_order_requests")
    .insert({
      request_number: requestNumber,
      user_id: user.id,
      address_id: addressId,
      store_items: validStoreItems,
      market_items: validMarketItems,
      shipping_method_id: shippingMethodId,
      shipping_name: method?.name ?? null,
      shipping_cost: quote.cost,
      shipping_weight_grams: Math.round(quote.weight),
    })
    .select("id")
    .single();

  if (error || !created) return { error: "خطا در ثبت درخواست: " + (error?.message ?? "") };

  redirect(`/bulk-order/${created.id}`);
}