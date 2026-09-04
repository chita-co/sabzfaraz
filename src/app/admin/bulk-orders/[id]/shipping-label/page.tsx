import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminShippingLabelView from "@/components/admin/AdminShippingLabelView";

export default async function BulkOrderShippingLabelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: request }, { data: settings }] = await Promise.all([
    supabase.from("bulk_order_requests").select("*, profile:profiles(full_name, phone), address:addresses(*)").eq("id", id).single(),
    supabase.from("site_settings").select("store_name, support_phone, support_phone_2, support_email, store_address").eq("id", 1).single(),
  ]);
  if (!request) notFound();

  return (
    <AdminShippingLabelView
      orderId={id}
      orderNumber={request.request_number}
      date={new Date(request.created_at).toLocaleDateString("fa-IR")}
      storeName={settings?.store_name ?? "سبزفراز"}
      sender={{
        name: settings?.store_name ?? "سبزفراز",
        phones: [settings?.support_phone, settings?.support_phone_2].filter(Boolean) as string[],
        email: settings?.support_email ?? null,
        address: settings?.store_address ?? "",
      }}
      receiver={{
        name: request.profile?.full_name ?? "—",
        phone: request.address?.phone ?? request.profile?.phone ?? "—",
        postalCode: request.address?.postal_code ?? "",
        province: request.address?.province ?? "",
        city: request.address?.city ?? "",
        addressLine: request.address?.address_line ?? "",
      }}
      fileName={`shipping-label-${request.request_number}.pdf`}
    />
  );
}