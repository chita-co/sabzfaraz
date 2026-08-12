import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminShippingLabelView from "@/components/admin/AdminShippingLabelView";

export default async function ShippingLabelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: order }, { data: settings }] = await Promise.all([
    supabase.from("orders").select("*, profile:profiles(full_name, phone), address:addresses(*)").eq("id", id).single(),
    supabase.from("site_settings").select("store_name, support_phone, support_phone_2, support_email, store_address").eq("id", 1).single(),
  ]);
  if (!order) notFound();

  return (
    <AdminShippingLabelView
      orderNumber={order.order_number}
      date={new Date(order.created_at).toLocaleDateString("fa-IR")}
      storeName={settings?.store_name ?? "سبزفراز"}
      sender={{
        name: settings?.store_name ?? "سبزفراز",
        phones: [settings?.support_phone, settings?.support_phone_2].filter(Boolean) as string[],
        email: settings?.support_email ?? null,
        address: settings?.store_address ?? "",
      }}
      receiver={{
        name: order.profile?.full_name ?? "—",
        phone: order.address?.phone ?? order.profile?.phone ?? "—",
        postalCode: order.address?.postal_code ?? "",
        province: order.address?.province ?? "",
        city: order.address?.city ?? "",
        addressLine: order.address?.address_line ?? "",
      }}
      fileName={`shipping-label-${order.order_number}.pdf`}
    />
  );
}