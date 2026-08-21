"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { buildInvoiceHtml } from "@/lib/buildInvoiceHtml";
import { renderInvoiceToPdf } from "@/lib/generateInvoicePdf";
import { imageUrlToDataUri } from "@/lib/invoiceImage";

interface InvoiceLineItem {
  name: string;
  variant?: string;
  price: number;
  quantity: number;
}

export default function InvoiceDownloadButton({
  orderNumber,
  createdAt,
  customerName,
  address,
  phone,
  postalCode,
  items,
  subtotal,
  shippingCost,
  logoUrl,
  storeName = "سبزفراز",
  storePhones,
  storeAddress = "",
  storeEmail,
  invoiceType,
  chinaDeliveryText,
  chinaTermsText,
}: {
  orderNumber: string;
  createdAt: string;
  customerName: string;
  address: string;
  phone: string;
  postalCode?: string;
  items: InvoiceLineItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  logoUrl: string | null;
  storeName?: string;
  storePhones?: string[];
  storeAddress?: string;
  storeEmail?: string | null;
  invoiceType?: "final" | "china";
  chinaDeliveryText?: string;
  chinaTermsText?: string;
}) {
  const [generating, setGenerating] = useState(false);

  async function handleDownload() {
    setGenerating(true);
    try {
      const logoDataUri = logoUrl ? await imageUrlToDataUri(logoUrl) : null;

      const html = buildInvoiceHtml({
        type: invoiceType ?? "final",
        invoiceNumber: orderNumber,
        date: new Date(createdAt).toLocaleDateString("fa-IR"),
        storeName,
        storePhones: storePhones && storePhones.length > 0 ? storePhones : ["—"],
        storeAddress,
        logoDataUri,
        storeEmail,
        chinaDeliveryText,
        chinaTermsText,
        buyerName: customerName,
        buyerPhone: phone,
        buyerAddress: address,
        buyerPostalCode: postalCode,
        items: items.map((i) => ({ name: i.name, variant: i.variant, quantity: i.quantity, unitPrice: i.price })),
        subtotal,
        shippingCost,
      });

      await renderInvoiceToPdf(html, `invoice-${orderNumber}.pdf`);
    } catch (e) {
      console.error(e);
      alert("خطا در ساخت فاکتور.");
    }
    setGenerating(false);
  }

  return (
    <button onClick={handleDownload} disabled={generating} className="invoice-download-btn">
      {generating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
      {generating ? "در حال آماده‌سازی..." : "دانلود PDF فاکتور"}
    </button>
  );
}