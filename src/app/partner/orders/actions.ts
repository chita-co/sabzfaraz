"use server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireActivePartner } from "@/lib/partners/auth";
import { notifyAllAdmins } from "@/lib/notifications";
import { revalidatePath } from "next/cache";

export async function updateOrderItemFulfillmentAction(itemId: string, status: "PREPARING" | "READY_FOR_PICKUP") {
  const partner = await requireActivePartner();
  const admin = createAdminClient();

  const { data: item } = await admin.from("order_items").select("partner_id, product_name").eq("id", itemId).single();
  if (!item || item.partner_id !== partner.id) return { error: "دسترسی غیرمجاز" };

  const payload: Record<string, unknown> = { partner_fulfillment_status: status };
  if (status === "READY_FOR_PICKUP") payload.partner_ready_at = new Date().toISOString();

  await admin.from("order_items").update(payload).eq("id", itemId);

  if (status === "READY_FOR_PICKUP") {
    try {
      await notifyAllAdmins("آماده تحویل به پیک 🛵", `«${partner.business_name}» محصول «${item.product_name}» را برای جمع‌آوری آماده کرد.`);
    } catch (e) { console.error(e); }
    try {
      await admin.rpc("recalculate_partner_rating", { p_partner_id: partner.id });
    } catch (e) { console.error(e); }
  }

  revalidatePath("/partner/orders");
  return { success: true };
}

export async function cancelOrderItemForStockoutAction(itemId: string) {
  const partner = await requireActivePartner();
  const admin = createAdminClient();

  const { data: item } = await admin.from("order_items").select("partner_id, product_name").eq("id", itemId).single();
  if (!item || item.partner_id !== partner.id) return { error: "دسترسی غیرمجاز" };

  await admin.from("order_items").update({ partner_fulfillment_status: "CANCELLED" }).eq("id", itemId);

  const { data: violationCount } = await admin.rpc("register_partner_stock_out_violation", { p_partner_id: partner.id });
  await admin.rpc("recalculate_partner_rating", { p_partner_id: partner.id });

  try {
    await notifyAllAdmins(
      "لغو سفارش بابت نبود موجودی ⚠️",
      `«${partner.business_name}» سفارش محصول «${item.product_name}» را به دلیل نبود موجودی لغو کرد. (تخلف شماره ${violationCount ?? "?"}) — لطفاً بازگشت وجه به مشتری و جریمه را بررسی کنید.`
    );
  } catch (e) { console.error(e); }

  revalidatePath("/partner/orders");
  return { success: true };
}