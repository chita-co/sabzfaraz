import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ManualInvoiceBuilder from "@/components/admin/ManualInvoiceBuilder";

export default async function BulkOrderInvoiceBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: request }, { data: settings }] = await Promise.all([
    supabase.from("bulk_order_requests").select("*, profile:profiles(full_name, phone), address:addresses(*)").eq("id", id).single(),
    supabase.from("site_settings").select("store_name, support_phone, support_phone_2, store_address, logo_url").eq("id", 1).single(),
  ]);
  if (!request) notFound();

  return (
    <ManualInvoiceBuilder
      requestId={id}
      requestNumber={request.request_number}
      buyerName={request.profile?.full_name ?? "—"}
      buyerPhone={request.address?.phone ?? request.profile?.phone ?? "—"}
      buyerAddress={request.address ? `${request.address.province}، ${request.address.city}، ${request.address.address_line}` : "—"}
      storeName={settings?.store_name ?? "سبزفراز"}
      storePhones={[settings?.support_phone, settings?.support_phone_2].filter(Boolean) as string[]}
      storeAddress={settings?.store_address ?? ""}
      logoUrl={settings?.logo_url ?? null}
      initialHtml={request.final_invoice_html}
      initialNumber={request.final_invoice_number}
    />
  );
}