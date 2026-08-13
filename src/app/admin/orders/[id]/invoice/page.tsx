import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AutoPrint from "@/components/admin/AutoPrint";
import AdminInvoiceView from "@/components/admin/AdminInvoiceView";
import { buildInvoiceHtml } from "@/lib/buildInvoiceHtml";
import { fetchImageAsDataUriServer } from "@/lib/fetchImageAsDataUri.server";

type InvoiceItem = {
  id: string;
  product_name: string;
  selected_color: string | null;
  selected_size: string | null;
  quantity: number;
  price: number;
};

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: order }, { data: settings }] = await Promise.all([
    supabase
      .from("orders")
      .select("*, profile:profiles(full_name, phone), address:addresses(*), items:order_items(*)")
      .eq("id", id)
      .single(),
    supabase.from("site_settings").select("store_name, support_phone, support_phone_2, store_address, logo_url, support_email").eq("id", 1).single(),
  ]);

  if (!order) notFound();

  const logoDataUri = settings?.logo_url ? await fetchImageAsDataUriServer(settings.logo_url) : null;
  const phones = Array.from(
  new Set(
    [settings?.support_phone, settings?.support_phone_2]
      .filter(Boolean)
      .flatMap((x) => String(x).split(/[-–—]/).map((s) => s.trim()))
      .filter(Boolean)
  )
) as string[];
  const subtotal = order.total_amount - (order.shipping_cost ?? 0);

  const html = buildInvoiceHtml({
    type: "final",
    invoiceNumber: order.order_number,
    date: new Date(order.created_at).toLocaleDateString("fa-IR"),
    storeName: settings?.store_name ?? "سبزفراز",
    storePhones: phones.length > 0 ? phones : ["—"],
    storeAddress: settings?.store_address ?? "",
    logoDataUri,
    storeEmail: settings?.support_email ?? null,
    buyerName: order.profile?.full_name ?? "—",
    buyerPhone: order.address?.phone ?? order.profile?.phone ?? "—",
    buyerAddress: `${order.address?.province ?? ""}، ${order.address?.city ?? ""}، ${order.address?.address_line ?? ""}`,
    items: (order.items as InvoiceItem[]).map((i) => ({
      name: i.product_name,
      variant: [i.selected_color, i.selected_size].filter(Boolean).join(" / ") || undefined,
      quantity: i.quantity,
      unitPrice: i.price,
    })),
    subtotal,
    shippingCost: order.shipping_cost ?? 0,
  });

  return (
    <div className="invoice-print-wrap" style={{ maxWidth: 760, margin: "0 auto", padding: 24 }}>
      <AutoPrint />
      <AdminInvoiceView html={html} fileName={`invoice-${order.order_number}.pdf`} />
    </div>
  );
}