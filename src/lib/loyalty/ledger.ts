import { createAdminClient } from "@/lib/supabase/admin";
import { getLoyaltySettings, calculatePointsToEarn } from "./settings";
import { createNotification } from "@/lib/notifications";

async function recalculateTier(admin: ReturnType<typeof createAdminClient>, userId: string) {
  const { data: profile } = await admin.from("profiles").select("loyalty_points_lifetime").eq("id", userId).single();
  if (!profile) return;

  const { data: tiers } = await admin
    .from("loyalty_tiers")
    .select("id, min_lifetime_points")
    .lte("min_lifetime_points", profile.loyalty_points_lifetime)
    .order("min_lifetime_points", { ascending: false })
    .limit(1);

  const newTierId = tiers?.[0]?.id ?? null;
  if (newTierId) await admin.from("profiles").update({ loyalty_tier_id: newTierId }).eq("id", userId);
}

export async function getUserTierMultiplier(userId: string | null): Promise<number> {
  if (!userId) return 1;
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("loyalty_tier:loyalty_tiers(points_multiplier)")
    .eq("id", userId)
    .single();
  const tier = profile?.loyalty_tier as unknown as { points_multiplier: number } | null;
  return tier?.points_multiplier ?? 1;
}

// امتیاز بابت سفارش را ثبت می‌کند — فقط هنگام تغییر وضعیت به «تحویل‌شده»
export async function earnPointsForOrder(orderId: string) {
  const admin = createAdminClient();
  const settings = await getLoyaltySettings();

  const { data: order } = await admin
    .from("orders")
    .select("id, user_id, total_amount, shipping_cost, loyalty_earned_processed")
    .eq("id", orderId)
    .single();

  if (!order || order.loyalty_earned_processed) return;

  const subtotal = order.total_amount - (order.shipping_cost ?? 0);
  const multiplier = await getUserTierMultiplier(order.user_id);
  const points = calculatePointsToEarn(subtotal, settings.tomanPerPoint, multiplier);

  if (points <= 0) {
    await admin.from("orders").update({ loyalty_earned_processed: true }).eq("id", orderId);
    return;
  }

  const { data: profile } = await admin
    .from("profiles").select("loyalty_points_balance, loyalty_points_lifetime").eq("id", order.user_id).single();

  const newBalance = (profile?.loyalty_points_balance ?? 0) + points;
  const newLifetime = (profile?.loyalty_points_lifetime ?? 0) + points;
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + settings.expiryMonths);

  await admin.from("profiles").update({
    loyalty_points_balance: newBalance,
    loyalty_points_lifetime: newLifetime,
  }).eq("id", order.user_id);

  await admin.from("loyalty_transactions").insert({
    user_id: order.user_id, order_id: orderId, type: "EARNED",
    points, points_remaining: points, balance_after: newBalance,
    description: `بابت سفارش ${orderId.slice(0, 8)}`, expires_at: expiresAt.toISOString(),
  });

  await admin.from("orders").update({ loyalty_points_earned: points, loyalty_earned_processed: true }).eq("id", orderId);
  await recalculateTier(admin, order.user_id);

  await createNotification(
    order.user_id,
    "امتیاز جدید دریافت کردی! 🎉",
    `${points.toLocaleString("fa-IR")} امتیاز بابت خرید اخیرت به حسابت اضافه شد. الان می‌تونی ${(points * settings.pointValueToman).toLocaleString("fa-IR")} تومان از این امتیاز رو در خرید بعدی استفاده کنی.`
  );
}

// مصرف امتیاز به‌صورت FIFO هنگام ثبت سفارش
export async function redeemPointsForOrder(userId: string, orderId: string, pointsToRedeem: number) {
  if (pointsToRedeem <= 0) return { success: true, discountAmount: 0 };
  const admin = createAdminClient();
  const settings = await getLoyaltySettings();

  const { data: profile } = await admin.from("profiles").select("loyalty_points_balance").eq("id", userId).single();
  if (!profile || profile.loyalty_points_balance < pointsToRedeem) {
    return { error: "امتیاز کافی برای مصرف موجود نیست." };
  }

  const { data: batches } = await admin
    .from("loyalty_transactions")
    .select("id, points_remaining")
    .eq("user_id", userId).eq("type", "EARNED")
    .gt("points_remaining", 0).gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: true });

  let remaining = pointsToRedeem;
  for (const batch of batches ?? []) {
    if (remaining <= 0) break;
    const consume = Math.min(batch.points_remaining, remaining);
    await admin.from("loyalty_transactions").update({ points_remaining: batch.points_remaining - consume }).eq("id", batch.id);
    remaining -= consume;
  }

  const newBalance = profile.loyalty_points_balance - pointsToRedeem;
  await admin.from("profiles").update({ loyalty_points_balance: newBalance }).eq("id", userId);

  await admin.from("loyalty_transactions").insert({
    user_id: userId, order_id: orderId, type: "REDEEMED",
    points: -pointsToRedeem, points_remaining: 0, balance_after: newBalance,
    description: `مصرف‌شده در سفارش ${orderId.slice(0, 8)}`,
  });

  const discountAmount = pointsToRedeem * settings.pointValueToman;
  await admin.from("orders").update({ loyalty_points_redeemed: pointsToRedeem, loyalty_discount_amount: discountAmount }).eq("id", orderId);

  return { success: true, discountAmount };
}

// بازگرداندن امتیاز مصرف‌شده هنگام لغو/ناموفق‌شدن سفارش
export async function refundRedeemedPoints(orderId: string) {
  const admin = createAdminClient();
  const { data: order } = await admin.from("orders").select("user_id, loyalty_points_redeemed").eq("id", orderId).single();
  if (!order || !order.loyalty_points_redeemed) return;

  const { data: profile } = await admin.from("profiles").select("loyalty_points_balance").eq("id", order.user_id).single();
  const newBalance = (profile?.loyalty_points_balance ?? 0) + order.loyalty_points_redeemed;

  await admin.from("profiles").update({ loyalty_points_balance: newBalance }).eq("id", order.user_id);
  await admin.from("loyalty_transactions").insert({
    user_id: order.user_id, order_id: orderId, type: "REFUNDED",
    points: order.loyalty_points_redeemed, points_remaining: 0, balance_after: newBalance,
    description: `بازگشت امتیاز بابت لغو سفارش ${orderId.slice(0, 8)}`,
  });
  await admin.from("orders").update({ loyalty_points_redeemed: 0, loyalty_discount_amount: 0 }).eq("id", orderId);
}

// اگر سفارشی که قبلاً امتیازش واریز شده لغو/مرجوع شد، امتیاز مصرف‌نشده‌اش را باطل می‌کند
export async function reverseEarnedPoints(orderId: string) {
  const admin = createAdminClient();
  const { data: earnedTx } = await admin
    .from("loyalty_transactions").select("id, user_id, points_remaining")
    .eq("order_id", orderId).eq("type", "EARNED").maybeSingle();

  if (!earnedTx || earnedTx.points_remaining <= 0) return;

  const { data: profile } = await admin.from("profiles").select("loyalty_points_balance").eq("id", earnedTx.user_id).single();
  const newBalance = Math.max(0, (profile?.loyalty_points_balance ?? 0) - earnedTx.points_remaining);

  await admin.from("profiles").update({ loyalty_points_balance: newBalance }).eq("id", earnedTx.user_id);
  await admin.from("loyalty_transactions").update({ points_remaining: 0 }).eq("id", earnedTx.id);
  await admin.from("loyalty_transactions").insert({
    user_id: earnedTx.user_id, order_id: orderId, type: "ADJUSTMENT",
    points: -earnedTx.points_remaining, points_remaining: 0, balance_after: newBalance,
    description: `کسر امتیاز بابت لغو/مرجوعی سفارش ${orderId.slice(0, 8)}`,
  });
}