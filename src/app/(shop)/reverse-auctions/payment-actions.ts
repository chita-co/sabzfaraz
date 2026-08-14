"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { requestPayment } from "@/lib/zarinpal";
import { uploadImage } from "@/lib/arvan";
import { createNotification } from "@/lib/notifications";

async function resolveSafeProductId(supabase: Awaited<ReturnType<typeof createClient>>, productId: string | null) {
  if (!productId) return null;
  const { data } = await supabase.from("products").select("id").eq("id", productId).maybeSingle();
  return data?.id ?? null;
}

async function validateBuyerContext(reverseAuctionId: string, userId: string) {
  const supabase = await createClient();
  const { data: auction } = await supabase.from("reverse_auctions").select("*").eq("id", reverseAuctionId).single();
  if (!auction) return { error: "کالا یافت نشد." } as const;
  if (auction.winner_user_id !== userId) return { error: "شما خریدار این کالا نیستید." } as const;
  if (auction.payment_status !== "PENDING") return { error: "این خرید در وضعیت پرداخت نهایی نیست." } as const;
  if (auction.payment_deadline && new Date(auction.payment_deadline) < new Date()) {
    return { error: "مهلت پرداخت این خرید به پایان رسیده است." } as const;
  }
  if (!auction.sold_price) return { error: "مبلغ این خرید مشخص نشده است." } as const;
  return { auction } as const;
}

async function notifyAdmins(supabase: Awaited<ReturnType<typeof createClient>>, title: string, body: string) {
  const { data: admins } = await supabase.from("profiles").select("id").eq("role", "ADMIN");
  for (const a of admins ?? []) await createNotification(a.id, title, body);
}

export async function createReverseAuctionOrderOnline(reverseAuctionId: string, addressId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ابتدا وارد حساب کاربری خود شوید." };

  const ctx = await validateBuyerContext(reverseAuctionId, user.id);
  if ("error" in ctx) return ctx;
  const { auction } = ctx;

  const { data: address } = await supabase.from("addresses").select("*").eq("id", addressId).eq("user_id", user.id).single();
  if (!address) return { error: "آدرس انتخابی معتبر نیست." };

  const total = Math.round((auction.sold_price as number) + (auction.shipping_cost ?? 0));
  const orderNumber = `RA${Date.now().toString().slice(-8)}`;
  const safeProductId = await resolveSafeProductId(supabase, auction.product_id);

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber, user_id: user.id, address_id: addressId,
      status: "PENDING", payment_status: "PENDING",
      total_amount: total, shipping_cost: auction.shipping_cost ?? 0,
      payment_method: "ONLINE", source: "REVERSE_AUCTION", related_reverse_auction_id: reverseAuctionId,
    })
    .select("id").single();
  if (orderError || !order) return { error: "خطا در ثبت سفارش: " + (orderError?.message ?? "") };

  const { error: itemError } = await supabase.from("order_items").insert({
    order_id: order.id, product_id: safeProductId, product_name: auction.title,
    product_image: auction.images?.[0] ?? "", price: auction.sold_price, quantity: 1,
  });
  if (itemError) return { error: "خطا در ثبت اقلام سفارش: " + itemError.message };

  const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/reverse-auctions/payment/callback?orderId=${order.id}`;
  let payment;
  try {
    payment = await requestPayment({ amount: total, description: `پرداخت خرید حراج معکوس «${auction.title}»`, callbackUrl, mobile: address.phone });
  } catch {
    return { error: "خطا در اتصال به درگاه پرداخت زرین‌پال." };
  }
  if (payment.status !== 100 || !payment.url) return { error: "اتصال به درگاه پرداخت با خطا مواجه شد." };

  await supabase.from("orders").update({ zarinpal_authority: payment.authority }).eq("id", order.id);
  redirect(payment.url);
}

export async function createReverseAuctionOrderOffline(
  reverseAuctionId: string, addressId: string, method: "CARD_TO_CARD" | "SHEBA", bankAccountId: string, receiptForm: FormData
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ابتدا وارد حساب کاربری خود شوید." };

  const ctx = await validateBuyerContext(reverseAuctionId, user.id);
  if ("error" in ctx) return ctx;
  const { auction } = ctx;

  const { data: address } = await supabase.from("addresses").select("id").eq("id", addressId).eq("user_id", user.id).single();
  if (!address) return { error: "آدرس انتخابی معتبر نیست." };

  const { data: bankAccount } = await supabase.from("bank_accounts").select("id").eq("id", bankAccountId).eq("is_active", true).single();
  if (!bankAccount) return { error: "حساب بانکی انتخابی معتبر نیست." };

  const file = receiptForm.get("file") as File | null;
  if (!file) return { error: "لطفاً تصویر رسید پرداخت را آپلود کنید." };

  let receiptUrl: string;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const sharp = (await import("sharp")).default;
    const { randomUUID } = await import("crypto");
    const optimized = await sharp(buffer).resize(1400, 1400, { fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
    receiptUrl = await uploadImage(optimized, `reverse-auction-receipts/${randomUUID()}.webp`);
  } catch {
    return { error: "خطا در آپلود تصویر رسید." };
  }

  const total = Math.round((auction.sold_price as number) + (auction.shipping_cost ?? 0));
  const orderNumber = `RA${Date.now().toString().slice(-8)}`;
  const safeProductId = await resolveSafeProductId(supabase, auction.product_id);

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber, user_id: user.id, address_id: addressId,
      status: "PENDING", payment_status: "AWAITING_CONFIRMATION",
      total_amount: total, shipping_cost: auction.shipping_cost ?? 0,
      payment_method: method, bank_account_id: bankAccountId, receipt_image_url: receiptUrl,
      source: "REVERSE_AUCTION", related_reverse_auction_id: reverseAuctionId,
    })
    .select("id").single();
  if (orderError || !order) return { error: "خطا در ثبت سفارش: " + (orderError?.message ?? "") };

  const { error: itemError } = await supabase.from("order_items").insert({
    order_id: order.id, product_id: safeProductId, product_name: auction.title,
    product_image: auction.images?.[0] ?? "", price: auction.sold_price, quantity: 1,
  });
  if (itemError) return { error: "خطا در ثبت اقلام سفارش: " + itemError.message };

  await notifyAdmins(supabase, "پرداخت خرید حراج معکوس اعلام شد", `کاربر پرداخت خرید «${auction.title}» را از طریق ${method === "CARD_TO_CARD" ? "کارت به کارت" : "شبا"} اعلام کرد. سفارش: ${orderNumber}`);

  redirect(`/reverse-auctions/${reverseAuctionId}/pay?submitted=1`);
}