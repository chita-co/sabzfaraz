"use client";

import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { CartItem } from "@/store/cart-store";

interface StoreInfo { name: string; phone: string; address: string; logoUrl: string | null; }
interface BuyerInfo { fullName: string; phone: string; province: string; city: string; addressLine: string; }

export default function ProformaInvoiceButton({
  items, subtotal, shippingCost, storeInfo, buyer,
}: {
  items: CartItem[]; subtotal: number; shippingCost: number; storeInfo: StoreInfo; buyer: BuyerInfo;
}) {
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const container = document.createElement("div");
      container.style.position = "fixed";
      container.style.left = "-9999px";
      container.style.top = "0";
      document.body.appendChild(container);

      const now = new Date();
      const validUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const total = subtotal + shippingCost;
      const proformaNumber = `PF-${now.getTime().toString().slice(-8)}`;

      container.innerHTML = `
        <div class="invoice-template" dir="rtl">
          <div class="invoice-top-row">
            <div class="invoice-customer-block">
              <h2>مشخصات خریدار</h2>
              <p>نام: ${buyer.fullName}</p>
              <p>تلفن: ${buyer.phone}</p>
              <p>آدرس: ${buyer.province}، ${buyer.city}، ${buyer.addressLine}</p>
            </div>
            <div class="invoice-brand-block">
              ${storeInfo.logoUrl ? `<img class="invoice-logo" src="${storeInfo.logoUrl}" crossorigin="anonymous" />` : ""}
              <h1>${storeInfo.name}</h1>
              <p>فروشنده: ${storeInfo.name}</p>
              <p>تلفن: ${storeInfo.phone}</p>
              <p>آدرس: ${storeInfo.address}</p>
            </div>
          </div>

          <div style="text-align:center; margin-bottom:16px;">
            <span style="display:inline-block; background:#fef3c7; color:#b45309; font-weight:800; padding:6px 20px; border-radius:8px; font-size:15px;">پیش‌فاکتور</span>
            <p style="font-size:11px; color:#9ca3af; margin-top:6px;">تاریخ صدور: ${now.toLocaleDateString("fa-IR")} — تاریخ اعتبار: ۱ روز (تا ${validUntil.toLocaleDateString("fa-IR")})</p>
            <p style="font-size:11px; color:#6b7280;">شماره پیش‌فاکتور: <span class="invoice-order-number">${proformaNumber}</span></p>
          </div>

          <table class="invoice-table">
            <thead><tr><th>ردیف</th><th>شرح کالا</th><th>تعداد</th><th>قیمت واحد</th><th>جمع</th></tr></thead>
            <tbody>
              ${items.map((item, i) => `
                <tr>
                  <td>${(i + 1).toLocaleString("fa-IR")}</td>
                  <td>${item.name}</td>
                  <td>${item.quantity.toLocaleString("fa-IR")}</td>
                  <td>${(item.discountPrice ?? item.price).toLocaleString("fa-IR")}</td>
                  <td>${((item.discountPrice ?? item.price) * item.quantity).toLocaleString("fa-IR")}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <div class="invoice-totals">
            <p>جمع کالاها: ${subtotal.toLocaleString("fa-IR")} تومان</p>
            <p>هزینه ارسال و بسته‌بندی: ${shippingCost.toLocaleString("fa-IR")} تومان</p>
            <p class="invoice-grand-total">مبلغ قابل پرداخت: ${total.toLocaleString("fa-IR")} تومان</p>
          </div>

          <p class="invoice-footer">این سند پیش‌فاکتور است و صرفاً جهت اطلاع از مبلغ نهایی صادر شده؛ فاکتور رسمی پس از پرداخت صادر می‌شود.</p>
        </div>
      `;

      const canvas = await html2canvas(container.querySelector(".invoice-template") as HTMLElement, {
        scale: 2, useCORS: true, backgroundColor: "#ffffff",
      });
      document.body.removeChild(container);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`proforma-${proformaNumber}.pdf`);
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