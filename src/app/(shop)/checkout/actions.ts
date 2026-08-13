"use server";

import { createClient } from "@/lib/supabase/server";
import { requestPayment } from "@/lib/zarinpal";
import { redirect } from "next/navigation";
import { redeemPointsForOrder } from "@/lib/loyalty/ledger";

interface CheckoutItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  discountPrice: number | null;
  selectedColor: string | null;
  selectedSize: string | null;
  quantity: number;
}

export async function createOrderAndPay(
  items: CheckoutItem[],
  addressId: string,
  shippingCost: number,
  loyaltyPointsToRedeem: number = 0,
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "برای ثبت سفارش باید وارد شوید." };
  if (items.length === 0) return { error: "سبد خرید شما خالی است." };

  const { data: address } = await supabase
    .from("addresses").select("*").eq("id", addressId).eq("user_id", user.id).single();
  if (!address) return { error: "آدرس انتخابی معتبر نیست." };

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

  let finalAmount = totalAmount;

  if (loyaltyPointsToRedeem > 0) {
    const redemption = await redeemPointsForOrder(user.id, order.id, loyaltyPointsToRedeem);
    if (redemption?.error) {
      return { error: redemption.error };
    }
    finalAmount = order.total_amount - (redemption.discountAmount ?? 0);
    if (finalAmount < 0) finalAmount = 0;

    await supabase.from("orders").update({ total_amount: finalAmount }).eq("id", order.id);
  }

  const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/payment/callback?orderId=${order.id}`;

  let payment;
  try {
    payment = await requestPayment({
      amount: finalAmount,
      description: `پرداخت سفارش ${orderNumber}`,
      callbackUrl,
      mobile: address.phone,
    });
  } catch {
    return { error: "خطا در اتصال به درگاه پرداخت زرین‌پال." };
  }

  if (payment.status !== 100 || !payment.url) {
    return { error: "اتصال به درگاه پرداخت با خطا مواجه شد." };
  }

  await supabase.from("orders").update({ zarinpal_authority: payment.authority }).eq("id", order.id);

  redirect(payment.url);
}

// ← تابع جدید را اینجا اضافه کنید (بعد از createOrderAndPay)

export async function createOfflineOrder(
  items: CheckoutItem[],
  addressId: string,
  shippingCost: number,
  paymentMethod: "CARD_TO_CARD" | "SHEBA",
  bankAccountId: string,
  loyaltyPointsToRedeem: number = 0,
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "برای ثبت سفارش باید وارد شوید." };
  if (items.length === 0) return { error: "سبد خرید شما خالی است." };

  const { data: address } = await supabase
    .from("addresses").select("*").eq("id", addressId).eq("user_id", user.id).single();
  if (!address) return { error: "آدرس انتخابی معتبر نیست." };

  const { data: bankAccount } = await supabase
    .from("bank_accounts").select("id").eq("id", bankAccountId).eq("is_active", true).single();
  if (!bankAccount) return { error: "حساب بانکی انتخابی معتبر نیست." };

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
      status: "PENDING",
      payment_status: "AWAITING_CONFIRMATION",
      payment_method: paymentMethod,
      bank_account_id: bankAccountId,
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

  let finalAmount = totalAmount;
  if (loyaltyPointsToRedeem > 0) {
    const { redeemPointsForOrder } = await import("@/lib/loyalty/ledger");
    const redemption = await redeemPointsForOrder(user.id, order.id, loyaltyPointsToRedeem);
    if (redemption?.error) return { error: redemption.error };
    finalAmount = order.total_amount - (redemption.discountAmount ?? 0);
    if (finalAmount < 0) finalAmount = 0;
    await supabase.from("orders").update({ total_amount: finalAmount }).eq("id", order.id);
  }

  redirect(`/order/${order.id}?payment=offline&status=registered`);
}