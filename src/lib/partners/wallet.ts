import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification, notifyAllAdmins } from "@/lib/notifications";
import { getPartnerSettings } from "./settings";

export async function creditPartnersForOrder(orderId: string) {
  const admin = createAdminClient();
  const { data: items } = await admin
    .from("order_items")
    .select("id, partner_id, partner_cost_price, quantity, product_name")
    .eq("order_id", orderId)
    .not("partner_id", "is", null);

  if (!items || items.length === 0) return;

  const settings = await getPartnerSettings();
  const { data: order } = await admin.from("orders").select("order_number").eq("id", orderId).single();

 const isInstant = settings.settlement_hold_days === 0;

  for (const item of items) {
    const amount = (item.partner_cost_price ?? 0) * item.quantity;
    if (amount <= 0) continue;

    const availableAt = isInstant
      ? new Date().toISOString()
      : new Date(Date.now() + settings.settlement_hold_days * 24 * 60 * 60 * 1000).toISOString();

    await admin.from("partner_wallet_transactions").insert({
      partner_id: item.partner_id,
      order_id: orderId,
      order_item_id: item.id,
      type: "SALE_EARNING",
      amount,
      status: isInstant ? "AVAILABLE" : "PENDING",
      description: `فروش «${item.product_name}» — سفارش ${order?.order_number ?? ""}`,
      available_at: availableAt,
    });

    if (isInstant) {
      // تسویه فوری: مستقیم به موجودی قابل برداشت اضافه کن
      const { data: p } = await admin
        .from("partners")
        .select("wallet_available_balance")
        .eq("id", item.partner_id)
        .single();
      await admin
        .from("partners")
        .update({ wallet_available_balance: (p?.wallet_available_balance ?? 0) + amount })
        .eq("id", item.partner_id);
    } else {
      try {
        await admin.rpc("increment_partner_pending_balance", { p_partner_id: item.partner_id, p_amount: amount });
      } catch (e) { console.error("خطا در افزایش موجودی در انتظار همکار:", e); }
    }

    try {
      await createNotification(item.partner_id, "فروش جدید 🎉", `محصول «${item.product_name}» شما در سفارش ${order?.order_number ?? ""} فروخته شد.`);
    } catch (e) { console.error(e); }
  }

  try {
    await notifyAllAdmins("فروش محصول همکار", `در سفارش ${order?.order_number ?? ""} حداقل یک محصول همکار فروخته شد.`);
  } catch (e) { console.error(e); }
}


/**
 * تراکنش‌های PENDING که available_at آن‌ها رسیده را برای یک همکار مشخص آزاد می‌کند.
 * بدون نیاز به کرون — وقتی همکار صفحه کیف پول را باز می‌کند اجرا می‌شود.
 */
export async function releaseMaturedPartnerBalances(partnerId: string) {
  const admin = createAdminClient();

  const { data: matured } = await admin
    .from("partner_wallet_transactions")
    .select("id")
    .eq("partner_id", partnerId)
    .eq("type", "SALE_EARNING")
    .eq("status", "PENDING")
    .lte("available_at", new Date().toISOString());

  if (!matured || matured.length === 0) return;

  const { data: released } = await admin
    .from("partner_wallet_transactions")
    .update({ status: "AVAILABLE" })
    .in("id", matured.map((t: { id: string }) => t.id))
    .eq("status", "PENDING")
    .select("amount");

  const total = (released ?? []).reduce((s: number, t: { amount: number }) => s + (t.amount ?? 0), 0);
  if (total <= 0) return;

  const { data: partner } = await admin
    .from("partners")
    .select("wallet_pending_balance, wallet_available_balance")
    .eq("id", partnerId)
    .single();
  if (!partner) return;

  await admin.from("partners").update({
    wallet_pending_balance: Math.max(0, partner.wallet_pending_balance - total),
    wallet_available_balance: partner.wallet_available_balance + total,
  }).eq("id", partnerId);
}