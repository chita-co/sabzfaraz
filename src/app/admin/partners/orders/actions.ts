"use server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications";
import { getPartnerSettings } from "@/lib/partners/settings";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("دسترسی غیرمجاز");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "ADMIN") throw new Error("دسترسی غیرمجاز");
}

export async function confirmPickupFromPartnerAction(itemIds: string[], courierName?: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { data: items } = await admin
    .from("order_items")
    .select("id, partner_id, product_name")
    .in("id", itemIds)
    .eq("partner_fulfillment_status", "READY_FOR_PICKUP");
  if (!items || items.length === 0) return { error: "هیچ آیتم قابل‌تأییدی یافت نشد." };

  const { error } = await admin.from("order_items").update({
    partner_fulfillment_status: "PICKED_UP",
    picked_up_at: new Date().toISOString(),
    picked_up_by: courierName || null,
  }).in("id", items.map((i) => i.id));
  if (error) return { error: error.message };

  const partnerIds = [...new Set(items.map((i) => i.partner_id).filter(Boolean))] as string[];
  for (const pid of partnerIds) {
    try {
      await createNotification(pid, "پیک اجناس را تحویل گرفت 🛵", "پیک سبزفراز اجناس شما را تحویل گرفت. پس از تحویل به مشتری، مبلغ به کیف پول شما اضافه می‌شود.");
    } catch (e) { console.error(e); }
  }

  revalidatePath("/admin/partners/orders");
  revalidatePath("/admin/partners/orders/pickup-list");
  return { success: true, count: items.length };
}

export async function confirmDeliveryToCustomerAction(itemIds: string[]) {
  await requireAdmin();
  const admin = createAdminClient();
  const { data: items } = await admin
    .from("order_items")
    .select("id, partner_id, partner_cost_price, quantity, product_name, order_id")
    .in("id", itemIds)
    .eq("partner_fulfillment_status", "PICKED_UP");
  if (!items || items.length === 0) return { error: "هیچ آیتم قابل‌تأییدی یافت نشد." };

  const { error } = await admin.from("order_items").update({
    partner_fulfillment_status: "DELIVERED_TO_CUSTOMER",
    delivered_to_customer_at: new Date().toISOString(),
  }).in("id", items.map((i) => i.id));
  if (error) return { error: error.message };

  const settings = await getPartnerSettings();

  for (const item of items) {
    if (!item.partner_id) continue;
    const amount = (item.partner_cost_price ?? 0) * item.quantity;
    if (amount <= 0) continue;

    const { data: alreadyCredited } = await admin
      .from("partner_wallet_transactions")
      .select("id")
      .eq("order_item_id", item.id)
      .eq("type", "SALE_EARNING")
      .maybeSingle();
    if (alreadyCredited) continue;

    const availableAt = new Date(Date.now() + settings.settlement_hold_days * 24 * 60 * 60 * 1000).toISOString();
    await admin.from("partner_wallet_transactions").insert({
      partner_id: item.partner_id, order_id: item.order_id, order_item_id: item.id,
      type: "SALE_EARNING", amount, status: "PENDING",
      description: `فروش «${item.product_name}» — تحویل‌شده به مشتری`, available_at: availableAt,
    });

    try {
      await admin.rpc("increment_partner_pending_balance", { p_partner_id: item.partner_id, p_amount: amount });
    } catch (e) { console.error(e); }

    try {
      await createNotification(item.partner_id, "تحویل موفق به مشتری ✅", `محصول «${item.product_name}» به مشتری تحویل داده شد و مبلغ آن به کیف پول شما (در انتظار تسویه) اضافه شد.`);
    } catch (e) { console.error(e); }
  }

  revalidatePath("/admin/partners/orders");
  return { success: true, count: items.length };
}

export async function reportStockShortageAction(
  itemId: string, reason: string, applyPenalty: boolean, penaltyAmount: number, refundCustomer: boolean
) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: item } = await admin
    .from("order_items")
    .select("id, partner_id, price, quantity, product_name, order_id, orders(user_id)")
    .eq("id", itemId)
    .single();
  if (!item) return { error: "آیتم یافت نشد." };

  await admin.from("order_items").update({
    partner_fulfillment_status: "STOCK_SHORTAGE",
    stock_shortage_reason: reason,
    stock_shortage_penalty_amount: applyPenalty ? penaltyAmount : null,
  }).eq("id", itemId);

  if (item.partner_id) {
    if (applyPenalty && penaltyAmount > 0) {
      const { data: partner } = await admin.from("partners").select("wallet_available_balance").eq("id", item.partner_id).single();
      if (partner) {
        await admin.from("partners").update({ wallet_available_balance: Math.max(0, partner.wallet_available_balance - penaltyAmount) }).eq("id", item.partner_id);
        await admin.from("partner_wallet_transactions").insert({
          partner_id: item.partner_id, order_id: item.order_id, order_item_id: item.id,
          type: "PENALTY", amount: -penaltyAmount, status: "AVAILABLE",
          description: `جریمه عدم تامین «${item.product_name}»: ${reason}`,
        });
        await admin.from("partner_penalties").insert({ partner_id: item.partner_id, order_id: item.order_id, amount: penaltyAmount, reason: `عدم تامین: ${reason}` });
      }
    }

    try {
      await admin.rpc("register_partner_stock_out_violation", { p_partner_id: item.partner_id });
      await admin.rpc("recalculate_partner_rating", { p_partner_id: item.partner_id });
    } catch (e) { console.error(e); }

    try {
      await createNotification(item.partner_id, "عدم تامین ثبت شد ⚠️", `محصول «${item.product_name}» به دلیل «${reason}» عدم تامین ثبت شد.${applyPenalty ? ` مبلغ ${penaltyAmount.toLocaleString("fa-IR")} تومان جریمه شد.` : ""}`);
    } catch (e) { console.error(e); }
  }

  const customerId = (item as unknown as { orders: { user_id: string } }).orders?.user_id;
  if (refundCustomer && customerId) {
    const refundAmount = item.price * item.quantity;
    try {
      await admin.rpc("credit_customer_wallet_for_shortage", { p_user_id: customerId, p_amount: refundAmount });
      await createNotification(customerId, "بازگشت وجه به کیف پول 💰", `به دلیل عدم تامین «${item.product_name}»، مبلغ ${refundAmount.toLocaleString("fa-IR")} تومان به کیف پول شما بازگشت داده شد.`);
    } catch (e) { console.error(e); }
  }

  revalidatePath("/admin/partners/orders");
  return { success: true };
}

export async function returnFromCustomerAction(itemId: string, reason: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { data: item } = await admin.from("order_items").select("id, product_name").eq("id", itemId).single();
  if (!item) return { error: "آیتم یافت نشد." };

  await admin.from("order_items").update({
    partner_fulfillment_status: "RETURNED_BY_CUSTOMER",
    returned_at: new Date().toISOString(),
    return_reason: reason,
  }).eq("id", itemId);

  revalidatePath("/admin/partners/orders");
  return { success: true };
}

export async function getCollectionListItemsAction(itemIds: string[]) {
  await requireAdmin();
  if (itemIds.length === 0) return [];
  const admin = createAdminClient();

  // 1) دریافت آیتم‌های سفارش
  const { data: rawItems } = await admin
    .from("order_items")
    .select("id, product_name, quantity, selected_color, selected_size, partner_fulfillment_status, order_id, partner_id")
    .in("id", itemIds);

  // 2) استخراج شناسه‌های یکتای سفارش‌ها و همکاران
  const orderIds = [...new Set((rawItems ?? []).map((i) => i.order_id).filter(Boolean))];
  const partnerIds = [...new Set((rawItems ?? []).map((i) => i.partner_id).filter(Boolean))];

  // 3) دریافت اطلاعات تکمیلی سفارش‌ها و همکاران به‌صورت موازی
  const [{ data: ordersData }, { data: partnersData }] = await Promise.all([
    orderIds.length > 0
      ? admin.from("orders").select("id, order_number").in("id", orderIds)
      : Promise.resolve({ data: [] as { id: string; order_number: string }[] }),
    partnerIds.length > 0
      ? admin.from("partners").select("id, business_name, partner_code").in("id", partnerIds)
      : Promise.resolve({ data: [] as { id: string; business_name: string; partner_code: string | null }[] }),
  ]);

  // 4) ساخت Map برای دسترسی سریع
  const ordersMap = new Map((ordersData ?? []).map((o: { id: string; order_number: string }) => [o.id, o]));
  const partnersMap = new Map((partnersData ?? []).map((p: { id: string; business_name: string; partner_code: string | null }) => [p.id, p]));

  // 5) ترکیب و بازگرداندن نتیجه
  return (rawItems ?? []).map((it) => ({
    ...it,
    order: it.order_id ? ordersMap.get(it.order_id) ?? null : null,
    partner: it.partner_id ? partnersMap.get(it.partner_id) ?? null : null,
  }));
}