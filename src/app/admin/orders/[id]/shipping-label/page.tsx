import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ShippingLabelForm from "@/components/admin/ShippingLabelForm";

export default async function ShippingLabelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: order }, { data: settings }] = await Promise.all([
    supabase.from("orders").select("*, profile:profiles(full_name, phone), address:addresses(*), items:order_items(*)").eq("id", id).single(),
    supabase.from("site_settings").select("store_name, support_phone, store_address, store_postal_code").eq("id", 1).single(),
  ]);
  if (!order) notFound();

  return (
    <ShippingLabelForm
      orderNumber={order.order_number}
      date={new Date(order.created_at).toLocaleDateString("fa-IR")}
      sender={{
        name: settings?.store_name ?? "سبزفراز",
        phone: settings?.support_phone ?? "—",
        postalCode: settings?.store_postal_code ?? "",
        address: settings?.store_address ?? "",
      }}
      receiver={{
        name: order.profile?.full_name ?? "—",
        phone: order.address?.phone ?? order.profile?.phone ?? "—",
        postalCode: order.address?.postal_code ?? "",
        address: `${order.address?.province ?? ""}، ${order.address?.city ?? ""}، ${order.address?.address_line ?? ""}`,
      }}
      items={(order.items ?? []).map((i: { product_name: string; quantity: number; price: number }) => ({
        name: i.product_name,
        qty: i.quantity,
        value: i.price * i.quantity,
      }))}
    />
  );
}