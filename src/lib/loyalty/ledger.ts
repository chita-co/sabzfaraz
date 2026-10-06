import { createAdminClient } from "@/lib/supabase/admin";
import { getLoyaltySettings } from "./settings";
import { calculatePointsToEarn } from "./points-utils";
import { createNotification } from "@/lib/notifications";
import { sendLoyaltyPointsEarnedSms } from "@/lib/sms";

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
    .select("id, user_id, total_amount, shipping_cost, loyalty_earned_processed, profile:profiles(full_name, phone), address:addresses(phone)")
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

  const orderProfile = order.profile as unknown as { full_name?: string; phone?: string } | null;
  const address = order.address as unknown as { phone?: string } | null;
  const phone = orderProfile?.phone ?? address?.phone;
  const customerName = orderProfile?.full_name?.trim() || "کاربر";

  if (phone) {
    try {
      await sendLoyaltyPointsEarnedSms(phone, customerName, points);
    } catch (e) {
      console.error("خطا در ارسال پیامک امتیاز وفاداری:", e);
    }
  }
}


// مصرف امتیاز به‌صورت FIFO هنگام ثبت سفارش
// کل عملیات داخل یک تابع اتمیک دیتابیس (redeem_loyalty_points) انجام می‌شود تا
// درخواست‌های موازی نتوانند یک امتیاز را دو بار مصرف کنند.
export async function redeemPointsForOrder(userId: string, orderId: string, pointsToRedeem: number) {
  if (pointsToRedeem <= 0) return { success: true, discountAmount: 0 };
  if (!Number.isInteger(pointsToRedeem)) return { error: "تعداد امتیاز نامعتبر است." };

  const admin = createAdminClient();
  const settings = await getLoyaltySettings();

  const { data, error } = await admin.rpc("redeem_loyalty_points", {
    p_user_id: userId,
    p_order_id: orderId,
    p_points: pointsToRedeem,
    p_point_value: settings.pointValueToman,
  });

  if (error) {
    console.error("خطا در مصرف امتیاز:", error.message);
    return { error: "خطا در مصرف امتیاز. لطفاً دوباره تلاش کنید." };
  }

  const result = data as { success?: boolean; error?: string; discountAmount?: number } | null;
  if (!result || result.error) {
    return { error: result?.error ?? "خطا در مصرف امتیاز." };
  }

  return { success: true, discountAmount: Number(result.discountAmount ?? 0) };
}

// بازگرداندن امتیاز مصرف‌شده هنگام لغو/ناموفق‌شدن سفارش
// اتمیک و ایدمپوتنت: چند فراخوانی همزمان فقط یک بار امتیاز را برمی‌گرداند.
export async function refundRedeemedPoints(orderId: string) {
  const admin = createAdminClient();
  const { error } = await admin.rpc("refund_redeemed_loyalty_points", { p_order_id: orderId });
  if (error) throw new Error(error.message);
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