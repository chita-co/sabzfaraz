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

  for (const item of items) {
    const amount = (item.partner_cost_price ?? 0) * item.quantity;
    if (amount <= 0) continue;

    const availableAt = new Date(Date.now() + settings.settlement_hold_days * 24 * 60 * 60 * 1000).toISOString();

    await admin.from("partner_wallet_transactions").insert({
      partner_id: item.partner_id,
      order_id: orderId,
      order_item_id: item.id,
      type: "SALE_EARNING",
      amount,
      status: "PENDING",
      description: `فروش «${item.product_name}» — سفارش ${order?.order_number ?? ""}`,
      available_at: availableAt,
    });

    try {
      await admin.rpc("increment_partner_pending_balance", { p_partner_id: item.partner_id, p_amount: amount });
    } catch (e) { console.error("خطا در افزایش موجودی در انتظار همکار:", e); }

    try {
      await createNotification(item.partner_id, "فروش جدید 🎉", `محصول «${item.product_name}» شما در سفارش ${order?.order_number ?? ""} فروخته شد.`);
    } catch (e) { console.error(e); }
  }

  try {
    await notifyAllAdmins("فروش محصول همکار", `در سفارش ${order?.order_number ?? ""} حداقل یک محصول همکار فروخته شد.`);
  } catch (e) { console.error(e); }
}