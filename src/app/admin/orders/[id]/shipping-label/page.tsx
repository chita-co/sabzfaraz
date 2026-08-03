import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AutoPrint from "@/components/admin/AutoPrint";
import AdminInvoiceView from "@/components/admin/AdminInvoiceView";
import { buildShippingLabelHtml } from "@/lib/buildInvoiceHtml";

export default async function ShippingLabelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: order }, { data: settings }] = await Promise.all([
    supabase.from("orders").select("*, profile:profiles(full_name, phone), address:addresses(*)").eq("id", id).single(),
    supabase.from("site_settings").select("store_name, support_phone, store_address").eq("id", 1).single(),
  ]);
  if (!order) notFound();

  const html = buildShippingLabelHtml({
    orderNumber: order.order_number,
    date: new Date(order.created_at).toLocaleDateString("fa-IR"),
    storeName: settings?.store_name ?? "سبزفراز",
    storePhone: settings?.support_phone ?? "—",
    storeAddress: settings?.store_address ?? "",
    buyerName: order.profile?.full_name ?? "—",
    buyerPhone: order.address?.phone ?? order.profile?.phone ?? "—",
    buyerAddress: `${order.address?.province ?? ""}، ${order.address?.city ?? ""}، ${order.address?.address_line ?? ""}`,
  });

  return (
    <div style={{ maxWidth: 500, margin: "0 auto", padding: 24 }}>
      <AutoPrint />
      <AdminInvoiceView html={html} fileName={`shipping-label-${order.order_number}.pdf`} />
    </div>
  );
}