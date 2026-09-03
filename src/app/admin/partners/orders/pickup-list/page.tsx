import { createAdminClient } from "@/lib/supabase/admin";
import PickupListView from "@/components/admin/PickupListView";

export const dynamic = "force-dynamic";

interface PickupItem {
  id: string;
  product_name: string;
  quantity: number;
  selected_color: string | null;
  selected_size: string | null;
  order: { order_number: string }[] | null;
  partner: {
    id: string;
    business_name: string;
    partner_code: string | null;
  }[] | null;
}

interface PickupRow {
  id: string;
  product_name: string;
  quantity: number;
  selected_color: string | null;
  selected_size: string | null;
  order: { order_number: string } | null;
  partner: {
    id: string;
    business_name: string;
    partner_code: string | null;
  } | null;
}

export default async function PickupListPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; partnerId?: string }>;
}) {
  const { from, to, partnerId } = await searchParams;
  const admin = createAdminClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const fromDate = from ? new Date(from) : todayStart;
  const toDate = to ? new Date(to) : new Date();
  toDate.setHours(23, 59, 59, 999);

  let query = admin
    .from("order_items")
    .select(
      "id, product_name, quantity, selected_color, selected_size, order:orders(order_number), partner:partners(id, business_name, partner_code)"
    )
    .eq("partner_fulfillment_status", "READY_FOR_PICKUP")
    .gte("created_at", fromDate.toISOString())
    .lte("created_at", toDate.toISOString());

  if (partnerId) query = query.eq("partner_id", partnerId);

  const { data: items } = await query;
  const { data: partners } = await admin
    .from("partners")
    .select("id, business_name, partner_code")
    .order("business_name");

  const grouped = new Map<
    string,
    { partnerName: string; partnerCode: string | null; rows: PickupRow[] }
  >();

  (items as PickupItem[] | null)?.forEach((raw) => {
    const partner = raw.partner?.[0] ?? null;
    const order = raw.order?.[0] ?? null;
    const row: PickupRow = {
      id: raw.id,
      product_name: raw.product_name,
      quantity: raw.quantity,
      selected_color: raw.selected_color,
      selected_size: raw.selected_size,
      partner,
      order,
    };

    const pid = partner?.id ?? "unknown";
    if (!grouped.has(pid)) {
      grouped.set(pid, {
        partnerName: partner?.business_name ?? "نامشخص",
        partnerCode: partner?.partner_code ?? null,
        rows: [],
      });
    }
    grouped.get(pid)!.rows.push(row);
  });

  return (
    <PickupListView
      groups={Array.from(grouped.values())}
      partners={partners ?? []}
      dateLabel={new Date().toLocaleDateString("fa-IR")}
    />
  );
}