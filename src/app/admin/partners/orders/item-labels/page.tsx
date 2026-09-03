import { createAdminClient } from "@/lib/supabase/admin";
import AdminItemLabelsView from "@/components/admin/AdminItemLabelsView";

interface ItemRow {
  product_name: string;
  quantity: number;
  selected_color: string | null;
  selected_size: string | null;
  order: { order_number: string }[] | null;
  partner: { business_name: string }[] | null;
}

export default async function PartnerOrderItemLabelsPage({
  searchParams,
}: { searchParams: Promise<{ ids?: string }> }) {
  const { ids } = await searchParams;
  const idList = (ids ?? "").split(",").filter(Boolean);
  const admin = createAdminClient();

  const { data: items } = await admin
    .from("order_items")
    .select("product_name, quantity, selected_color, selected_size, order:orders(order_number), partner:partners(business_name)")
    .in("id", idList);

  const labelItems = (items as unknown as ItemRow[]).map((i) => {
  const partnerName = i.partner?.[0]?.business_name ?? null;
  const orderNumber = i.order?.[0]?.order_number ?? null;
  return {
    name: i.product_name,
    partnerName,
    orderNumber,
    quantity: i.quantity,
    variant: [i.selected_color, i.selected_size].filter(Boolean).join(" / ") || null,
  };
});

  return (
    <AdminItemLabelsView
      orderNumber="اقلام همکاران"
      storeName="سبزفراز"
      storeAddress=""
      items={labelItems}
    />
  );
}