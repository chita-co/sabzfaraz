import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminItemLabelsView from "@/components/admin/AdminItemLabelsView";

type OrderItemLabelRow = {
  product_name: string;
  quantity: number;
  selected_color: string | null;
  selected_size: string | null;
};

export default async function ItemLabelsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: order }, { data: settings }] = await Promise.all([
    supabase.from("orders").select("order_number, items:order_items(product_name, quantity, selected_color, selected_size)").eq("id", id).single(),
    supabase.from("site_settings").select("store_name, store_address").eq("id", 1).single(),
  ]);
  if (!order) notFound();

  const items = (order.items ?? []).map((i: OrderItemLabelRow) => ({
    name: i.product_name,
    quantity: i.quantity,
    variant: [i.selected_color, i.selected_size].filter(Boolean).join(" / ") || null,
  }));

  return (
    <AdminItemLabelsView
      orderNumber={order.order_number}
      storeName={settings?.store_name ?? "سبزفراز"}
      storeAddress={settings?.store_address ?? ""}
      items={items}
    />
  );
}