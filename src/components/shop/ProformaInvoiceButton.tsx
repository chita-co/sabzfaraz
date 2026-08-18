"use client";

import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { CartItem } from "@/store/cart-store";
import { buildInvoiceHtml } from "@/lib/buildInvoiceHtml";
import { renderInvoiceToPdf } from "@/lib/generateInvoicePdf";
import { imageUrlToDataUri } from "@/lib/invoiceImage";

interface StoreInfo { name: string; phones: string[]; address: string; logoUrl: string | null; email?: string | null; }
interface BuyerInfo { fullName: string; phone: string; province: string; city: string; addressLine: string; }

export default function ProformaInvoiceButton({
  items, subtotal, shippingCost, storeInfo, buyer,
}: {
  items: CartItem[]; subtotal: number; shippingCost: number; storeInfo: StoreInfo; buyer: BuyerInfo; shippingMethodId?: string | null;
}) {
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const logoDataUri = storeInfo.logoUrl ? await imageUrlToDataUri(storeInfo.logoUrl) : null;

      const now = new Date();
      const validUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const proformaNumber = `PF-${now.getTime().toString().slice(-8)}`;

      const html = buildInvoiceHtml({
        type: "proforma",
        invoiceNumber: proformaNumber,
        date: now.toLocaleDateString("fa-IR"),
        validUntil: validUntil.toLocaleDateString("fa-IR"),
        storeName: storeInfo.name,
        storePhones: storeInfo.phones,
        storeAddress: storeInfo.address,
        storeEmail: storeInfo.email ?? null,
        logoDataUri,
        buyerName: buyer.fullName,
        buyerPhone: buyer.phone,
        buyerAddress: `${buyer.province}، ${buyer.city}، ${buyer.addressLine}`,
        items: items.map((i) => ({ name: i.name, quantity: i.quantity, unitPrice: i.discountPrice ?? i.price })),
        subtotal,
        shippingCost,
      });

      await renderInvoiceToPdf(html, `proforma-${proformaNumber}.pdf`);
    } catch (e) {
      console.error(e);
      alert("خطا در ساخت پیش‌فاکتور.");
    }
    setGenerating(false);
  }

  return (
    <button onClick={handleGenerate} disabled={generating} className="admin-btn admin-btn-secondary flex items-center gap-2 w-full justify-center">
      {generating ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
      {generating ? "در حال ساخت پیش‌فاکتور..." : "صدور پیش‌فاکتور (PDF)"}
    </button>
  );
}