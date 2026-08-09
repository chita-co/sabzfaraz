"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getLegacyShippingCost } from "@/lib/bulkOrder/shippingLookup";

export interface BulkItemInput {
  name: string;
  quantity: number;
  estimatedPrice: number;
  description: string;
}

export async function getShippingCostForAddress(addressId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "دسترسی غیرمجاز" };

  const { data: address } = await supabase.from("addresses").select("province, city").eq("id", addressId).eq("user_id", user.id).single();
  if (!address) return { error: "آدرس نامعتبر است." };

  const cost = await getLegacyShippingCost(address.province, address.city);
  return { cost };
}

export async function submitBulkOrder(
  items: BulkItemInput[],
  addressId: string,
  paymentMethod: "CARD_TO_CARD" | "SHEBA",
  bankAccountId: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "برای ثبت سفارش باید وارد شوید." };

  const validItems = items.filter((i) => i.name.trim() && i.quantity > 0);
  if (validItems.length === 0) return { error: "حداقل یک کالا با نام و تعداد معتبر وارد کنید." };

  const { data: address } = await supabase.from("addresses").select("*").eq("id", addressId).eq("user_id", user.id).single();
  if (!address) return { error: "آدرس انتخابی معتبر نیست." };

  const { data: bankAccount } = await supabase.from("bank_accounts").select("*").eq("id", bankAccountId).eq("is_active", true).single();
  if (!bankAccount) return { error: "حساب بانکی انتخابی معتبر نیست." };

  const { data: settings } = await supabase
    .from("site_settings")
    .select("bulk_order_enabled, bulk_order_fee_type, bulk_order_fee_value")
    .eq("id", 1).single();

  if (settings && !settings.bulk_order_enabled) {
    return { error: "در حال حاضر امکان ثبت سفارش جمعی وجود ندارد." };
  }

  const subtotal = validItems.reduce((sum, i) => sum + i.quantity * (i.estimatedPrice || 0), 0);
  const feeType = settings?.bulk_order_fee_type ?? "percent";
  const feeValue = settings?.bulk_order_fee_value ?? 10;
  const serviceFee = feeType === "percent" ? Math.round((subtotal * feeValue) / 100) : feeValue;
  const shippingCost = await getLegacyShippingCost(address.province, address.city);
  const total = subtotal + serviceFee + shippingCost;

  const requestNumber = `BULK-${Date.now().toString().slice(-8)}`;

  const { data: created, error } = await supabase.from("bulk_order_requests").insert({
    request_number: requestNumber,
    user_id: user.id,
    address_id: addressId,
    items: validItems,
    subtotal_estimated: subtotal,
    service_fee_type: feeType,
    service_fee_amount: serviceFee,
    shipping_cost: shippingCost,
    total_estimated: total,
    payment_method: paymentMethod,
    bank_account_id: bankAccountId,
  }).select("id").single();

  if (error || !created) return { error: "خطا در ثبت سفارش: " + (error?.message ?? "") };

  redirect(`/bulk-order/${created.id}`);
}