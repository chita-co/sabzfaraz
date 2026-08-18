"use server";

import { createClient } from "@/lib/supabase/server";
import { requestPayment } from "@/lib/zarinpal";
import { redirect } from "next/navigation";
import { redeemPointsForOrder } from "@/lib/loyalty/ledger";
import { consumeDiscountCode } from "@/lib/discountCode";
import { completePendingCheckout } from "./pending-actions";

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

async function decrementStockForItems(
  supabase: Awaited<ReturnType<typeof createClient>>,
  items: CheckoutItem[]
) {
  for (const item of items) {
    try {
      await supabase.rpc("decrement_product_stock", {
        p_product_id: item.productId,
        p_qty: item.quantity,
      });
    } catch (e) {
      console.error("خطا در کسر موجودی محصول:", e);
    }
  }
}

export async function createOrderAndPay(
  items: CheckoutItem[],
  addressId: string,
  shippingCost: number,
  loyaltyPointsToRedeem: number = 0,
  discountCodeId: string | null = null,
  walletAmountToUse: number = 0,
  pendingCheckoutId: string | null = null
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "برای ثبت سفارش باید وارد شوید." };
  if (items.length === 0) return { error: "سبد خرید شما خالی است." };

  const { data: address } = await supabase
    .from("addresses")
    .select("*")
    .eq("id", addressId)
    .eq("user_id", user.id)
    .single();
  if (!address) return { error: "آدرس انتخابی معتبر نیست." };

  const subtotal = items.reduce(
    (sum, i) => sum + (i.discountPrice ?? i.price) * i.quantity,
    0
  );
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
      pending_checkout_id: pendingCheckoutId,
    })
    .select()
    .single();

  if (orderError || !order)
    return { error: "خطا در ثبت سفارش: " + orderError?.message };

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
  if (itemsError)
    return { error: "خطا در ثبت اقلام سفارش: " + itemsError.message };

  let finalAmount = totalAmount;

  if (loyaltyPointsToRedeem > 0) {
    const redemption = await redeemPointsForOrder(
      user.id,
      order.id,
      loyaltyPointsToRedeem
    );
    if (redemption?.error) return { error: redemption.error };
    finalAmount = finalAmount - (redemption.discountAmount ?? 0);
    if (finalAmount < 0) finalAmount = 0;
  }

  if (discountCodeId) {
    const consumed = await consumeDiscountCode(
      supabase,
      user.id,
      discountCodeId,
      finalAmount,
      order.id
    );
    if (consumed.error) return { error: consumed.error };
    finalAmount = finalAmount - consumed.discountAmount;
    if (finalAmount < 0) finalAmount = 0;
  }

  let remainder = finalAmount;
  if (walletAmountToUse > 0) {
    const requestedWalletUse = Math.min(walletAmountToUse, finalAmount);
    const { data: walletData, error: walletError } = await supabase.rpc(
      "debit_wallet_amount",
      {
        p_user_id: user.id,
        p_amount: requestedWalletUse,
        p_description: `پرداخت سفارش ${orderNumber} از کیف پول`,
        p_order_id: order.id,
      }
    );
    if (walletError) return { error: walletError.message };
    const walletResult = walletData as { debited?: number };
    remainder = finalAmount - (walletResult.debited ?? 0);
    if (remainder < 0) remainder = 0;
  }

  if (remainder !== totalAmount) {
    await supabase
      .from("orders")
      .update({ total_amount: remainder })
      .eq("id", order.id);
  }

  if (remainder === 0) {
    await supabase
      .from("orders")
      .update({ payment_status: "PAID", payment_method: "WALLET" })
      .eq("id", order.id);
    await decrementStockForItems(supabase, items);

    if (pendingCheckoutId) await completePendingCheckout(pendingCheckoutId);

    redirect(`/order/${order.id}?payment=success`);
  }

  const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/payment/callback?orderId=${order.id}`;

  let payment;
  try {
    payment = await requestPayment({
      amount: remainder,
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

  await supabase
    .from("orders")
    .update({ zarinpal_authority: payment.authority })
    .eq("id", order.id);

  redirect(payment.url);
}

export async function createOfflineOrder(
  items: CheckoutItem[],
  addressId: string,
  shippingCost: number,
  paymentMethod: "CARD_TO_CARD" | "SHEBA",
  bankAccountId: string,
  loyaltyPointsToRedeem: number = 0,
  discountCodeId: string | null = null,
  walletAmountToUse: number = 0,
  pendingCheckoutId: string | null = null
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "برای ثبت سفارش باید وارد شوید." };
  if (items.length === 0) return { error: "سبد خرید شما خالی است." };

  const { data: address } = await supabase
    .from("addresses")
    .select("*")
    .eq("id", addressId)
    .eq("user_id", user.id)
    .single();
  if (!address) return { error: "آدرس انتخابی معتبر نیست." };

  const { data: bankAccount } = await supabase
    .from("bank_accounts")
    .select("id")
    .eq("id", bankAccountId)
    .eq("is_active", true)
    .single();
  if (!bankAccount) return { error: "حساب بانکی انتخابی معتبر نیست." };

  const subtotal = items.reduce(
    (sum, i) => sum + (i.discountPrice ?? i.price) * i.quantity,
    0
  );
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
      payment_method: paymentMethod,
      bank_account_id: bankAccountId,
      pending_checkout_id: pendingCheckoutId,
    })
    .select()
    .single();

  if (orderError || !order)
    return { error: "خطا در ثبت سفارش: " + orderError?.message };

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
  if (itemsError)
    return { error: "خطا در ثبت اقلام سفارش: " + itemsError.message };

  let finalAmount = totalAmount;

  if (loyaltyPointsToRedeem > 0) {
    const redemption = await redeemPointsForOrder(
      user.id,
      order.id,
      loyaltyPointsToRedeem
    );
    if (redemption?.error) return { error: redemption.error };
    finalAmount = finalAmount - (redemption.discountAmount ?? 0);
    if (finalAmount < 0) finalAmount = 0;
  }

  if (discountCodeId) {
    const consumed = await consumeDiscountCode(
      supabase,
      user.id,
      discountCodeId,
      finalAmount,
      order.id
    );
    if (consumed.error) return { error: consumed.error };
    finalAmount = finalAmount - consumed.discountAmount;
    if (finalAmount < 0) finalAmount = 0;
  }

  let remainder = finalAmount;
  if (walletAmountToUse > 0) {
    const requestedWalletUse = Math.min(walletAmountToUse, finalAmount);
    const { data: walletData, error: walletError } = await supabase.rpc(
      "debit_wallet_amount",
      {
        p_user_id: user.id,
        p_amount: requestedWalletUse,
        p_description: `پرداخت سفارش ${orderNumber} از کیف پول`,
        p_order_id: order.id,
      }
    );
    if (walletError) return { error: walletError.message };
    const walletResult = walletData as { debited?: number };
    remainder = finalAmount - (walletResult.debited ?? 0);
    if (remainder < 0) remainder = 0;
  }

  if (remainder !== totalAmount) {
    await supabase
      .from("orders")
      .update({ total_amount: remainder })
      .eq("id", order.id);
  }

  if (remainder === 0) {
    await supabase
      .from("orders")
      .update({ payment_status: "PAID", payment_method: "WALLET" })
      .eq("id", order.id);
    await decrementStockForItems(supabase, items);

    if (pendingCheckoutId) await completePendingCheckout(pendingCheckoutId);

    redirect(`/order/${order.id}?payment=success`);
  }

  await supabase
    .from("orders")
    .update({ payment_status: "AWAITING_CONFIRMATION" })
    .eq("id", order.id);

  if (pendingCheckoutId) await completePendingCheckout(pendingCheckoutId);

  redirect(`/order/${order.id}?payment=offline&status=registered`);
}