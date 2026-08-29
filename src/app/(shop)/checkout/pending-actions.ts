"use server";

import { createClient } from "@/lib/supabase/server";
import { CartItem } from "@/store/cart-store";

export async function createPendingCheckout(items: CartItem[], shippingMethodId: string | null, shippingCost: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ابتدا وارد شوید." };

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("pending_checkouts")
    .insert({ user_id: user.id, items, shipping_method_id: shippingMethodId, shipping_cost: shippingCost, expires_at: expiresAt })
    .select()
    .single();

  if (error || !data) return { error: "خطا در ثبت پیش‌فاکتور." };
  return { success: true, id: data.id, expiresAt };
}

export async function getActivePendingCheckout() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("pending_checkouts")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "PENDING")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  if (new Date(data.expires_at) < new Date()) {
    await supabase.from("pending_checkouts").update({ status: "EXPIRED" }).eq("id", data.id);
    return { expired: true as const, items: data.items as CartItem[] };
  }

  return { expired: false as const, pending: data };
}

export async function completePendingCheckout(id: string) {
  const supabase = await createClient();
  await supabase.from("pending_checkouts").update({ status: "COMPLETED" }).eq("id", id);
}

export async function createOrderFromPendingCheckout(
  pendingCheckoutId: string,
  items: CartItem[],
  addressId: string,
  shippingCost: number
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "برای ثبت سفارش باید وارد شوید." };
  if (items.length === 0) return { error: "سبد خرید شما خالی است." };

  const { data: address } = await supabase
    .from("addresses").select("*").eq("id", addressId).eq("user_id", user.id).single();
  if (!address) return { error: "آدرس انتخابی معتبر نیست." };

  const { data: pendingCheckout } = await supabase
    .from("pending_checkouts").select("shipping_method_id").eq("id", pendingCheckoutId).single();

  const subtotal = items.reduce((sum, i) => sum + (i.discountPrice ?? i.price) * i.quantity, 0);
  const totalAmount = subtotal + shippingCost;
  const orderNumber = `SF${Date.now()}`;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      user_id: user.id,
      address_id: addressId,
      total_amount: totalAmount,
      shipping_cost: shippingCost,
      shipping_method_id: pendingCheckout?.shipping_method_id ?? null,
      status: "PENDING",
      payment_status: "PENDING",
    })
    .select()
    .single();

  if (orderError || !order) return { error: "خطا در ثبت سفارش: " + orderError?.message };

  const { error: itemsError } = await supabase.from("order_items").insert(
    items.map((i) => ({
      order_id: order.id,
      product_id: i.productId,
      product_name: i.name,
      product_image: i.image,
      price: i.discountPrice ?? i.price,
      quantity: i.quantity,
      selected_color: i.selectedColor,
      selected_size: i.selectedSize,
    }))
  );
  if (itemsError) return { error: "خطا در ثبت اقلام سفارش: " + itemsError.message };

  const { requestPayment } = await import("@/lib/sep");
  const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/payment/callback?orderId=${order.id}`;

  let payment;
  try {
    payment = await requestPayment({
      amount: totalAmount,
      resNum: order.id,
      redirectUrl: callbackUrl,
      mobile: address.phone,
    });
  } catch {
    return { error: "خطا در اتصال به درگاه پرداخت." };
  }

  await supabase.from("orders").update({ sep_token: payment.token, gateway_amount: totalAmount }).eq("id", order.id);

  const { redirect } = await import("next/navigation");
  redirect(payment.url);
}