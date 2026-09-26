import { createAdminClient } from "@/lib/supabase/admin";
import { getPaidOrderIdSet } from "./orderIntegration";

export interface WeeklySalesPoint { week: string; sales: number; }

export async function getPartnerWeeklySales(partnerId: string): Promise<WeeklySalesPoint[]> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - 8 * 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: rawItems } = await admin
    .from("order_items")
    .select("order_id, price, quantity, created_at")
    .eq("partner_id", partnerId)
    .neq("partner_fulfillment_status", "CANCELLED")
    .gte("created_at", since);

  const orderIds = [...new Set((rawItems ?? []).map((i) => i.order_id))];
  const paidOrderIds = await getPaidOrderIdSet(admin, orderIds);
  const items = (rawItems ?? []).filter((i) => paidOrderIds.has(i.order_id));

  const buckets = new Map<string, number>();
  for (let i = 0; i < 8; i++) buckets.set(`هفته ${i + 1}`, 0);

  const now = new Date();
  (items ?? []).forEach((it) => {
    const created = new Date(it.created_at);
    const diffWeeks = Math.floor((now.getTime() - created.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const weekIndex = 7 - diffWeeks;
    if (weekIndex >= 0 && weekIndex <= 7) {
      const label = `هفته ${weekIndex + 1}`;
      buckets.set(label, (buckets.get(label) ?? 0) + it.price * it.quantity);
    }
  });

  return Array.from(buckets.entries()).map(([week, sales]) => ({ week, sales }));
}