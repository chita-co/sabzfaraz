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

// هزینه‌ی پایه‌ی یک روش ارسال: هزینه‌ی اولین بازه‌ی وزنی همان روش
async function getBaseShippingCost(methodId: string): Promise<number | null> {
  const admin = createAdminClient();
  const { data: tiers } = await admin
    .from("shipping_weight_tiers")
    .select("min_weight_grams, cost")
    .eq("method_id", methodId)
    .order("min_weight_grams", { ascending: true })
    .limit(1);
  return tiers && tiers[0] ? Number(tiers[0].cost) : null;
}

// روش‌های ارسال فعال همان فهرست سفارش عادی، با هزینه‌ی پایه
export async function listBulkShippingMethods() {
  const admin = createAdminClient();
  const { data: methods } = await admin
    .from("shipping_methods")
    .select("id, name")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  const list = methods ?? [];
  if (list.length === 0) return [];

  const { data: tiers } = await admin
    .from("shipping_weight_tiers")
    .select("method_id, min_weight_grams, cost")
    .in("method_id", list.map((m) => m.id));

  const firstTier = new Map<string, { min: number; cost: number }>();
  for (const t of tiers ?? []) {
    const id = t.method_id as string;
    const min = Number(t.min_weight_grams);
    const prev = firstTier.get(id);
    if (!prev || min < prev.min) firstTier.set(id, { min, cost: Number(t.cost) });
  }

  return list.flatMap((m) => {
    const ft = firstTier.get(m.id as string);
    return ft ? [{ id: m.id as string, name: m.name as string, price: ft.cost }] : [];
  });
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
  const admin = createAdminClient();
  const { data: method } = await admin
    .from("shipping_methods")
    .select("id, name")
    .eq("id", shippingMethodId)
    .eq("is_active", true)
    .maybeSingle();
  if (!method) return { error: "نحوه‌ی ارسال انتخابی معتبر نیست." };

  const cost = await getBaseShippingCost(method.id as string);
  if (cost === null) return { error: "هزینه‌ی این روش ارسال تعریف نشده است." };

  const validStoreItems = storeItems.filter((i) => i.productId && i.quantity > 0);
  const validMarketItems = marketItems.filter((i) => i.name.trim() && i.quantity > 0);
  if (validStoreItems.length === 0 && validMarketItems.length === 0) {
    return { error: "حداقل یک کالا (از فروشگاه یا از بازار) اضافه کنید." };
  }

  const requestNumber = `BLK-${Date.now().toString().slice(-8)}`;

  const { data: created, error } = await supabase
    .from("bulk_order_requests")
    .insert({
      request_number: requestNumber,
      user_id: user.id,
      address_id: addressId,
      store_items: validStoreItems,
      market_items: validMarketItems,
      shipping_method_id: method.id,
      shipping_name: method.name,
      shipping_cost: cost,
    })
    .select("id")
    .single();

  if (error || !created) return { error: "خطا در ثبت درخواست: " + (error?.message ?? "") };

  redirect(`/bulk-order/${created.id}`);
}