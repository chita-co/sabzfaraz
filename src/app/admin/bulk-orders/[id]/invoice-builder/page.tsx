import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ManualInvoiceBuilder from "@/components/admin/ManualInvoiceBuilder";

type StoreItem = { productName: string; quantity: number; unitPrice: number };
type MarketItem = { name: string; quantity: number; finalUnitPrice?: number | null };

// اقلام سفارش جمعی را به ردیف‌های فاکتور تبدیل می‌کند
function buildInitialRows(request: {
  store_items?: unknown;
  market_items?: unknown;
  collection_fee?: number | null;
  shipping_name?: string | null;
  shipping_cost?: number | null;
}) {
  const store = (request.store_items ?? []) as StoreItem[];
  const market = (request.market_items ?? []) as MarketItem[];
  const rows: { name: string; qty: number; unitPrice: number }[] = [
    ...store.map((i) => ({ name: i.productName, qty: i.quantity, unitPrice: i.unitPrice })),
    ...market.map((i) => ({ name: i.name, qty: i.quantity, unitPrice: i.finalUnitPrice ?? 0 })),
  ];
  if ((request.collection_fee ?? 0) > 0) {
    rows.push({ name: "هزینه‌ی جمع‌آوری کالاهای بازار", qty: 1, unitPrice: request.collection_fee as number });
  }
  if ((request.shipping_cost ?? 0) > 0) {
    rows.push({
      name: `هزینه‌ی ارسال (${request.shipping_name ?? "ارسال"})`,
      qty: 1,
      unitPrice: request.shipping_cost as number,
    });
  }
  return rows;
}

export default async function BulkOrderInvoiceBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: request }, { data: settings }] = await Promise.all([
    supabase.from("bulk_order_requests").select("*, profile:profiles(full_name, phone), address:addresses(*)").eq("id", id).single(),
    supabase
  .from("site_settings")
  .select("store_name, support_phone, support_phone_2, store_address, logo_url, support_email")
  .eq("id", 1)
  .single(),
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
      storePhones={Array.from(
        new Set(
          [settings?.support_phone, settings?.support_phone_2]
            .filter(Boolean)
            .flatMap((x) => String(x).split(/[-–—]/).map((s) => s.trim()))
            .filter(Boolean)
        )
      ) as string[]}
      storeAddress={settings?.store_address ?? ""}
      logoUrl={settings?.logo_url ?? null}
      storeEmail={settings?.support_email ?? null}
      initialHtml={request.final_invoice_html}
      initialNumber={request.final_invoice_number}
      initialRows={buildInitialRows(request)}
      expectedTotal={request.final_total_amount ?? null}
    />
  );
}