"use client";

import { useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";

interface InvoiceItem {
  name: string;
  variant: string;
  price: number;
  quantity: number;
}

export default function InvoiceDownloadButton({
  orderNumber,
  createdAt,
  customerName,
  address,
  phone,
  items,
  subtotal,
  shippingCost,
  total,
  logoUrl,
}: {
  orderNumber: string;
  createdAt: string;
  customerName: string;
  address: string;
  phone: string;
  items: InvoiceItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  logoUrl?: string | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    if (!ref.current) return;
    setLoading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(ref.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });

      const pageWidthMm = 210;
      const pageHeightMm = 297;
      const marginMm = 10;
      const usableWidthMm = pageWidthMm - marginMm * 2;
      const usableHeightMm = pageHeightMm - marginMm * 2;

      const imgWidthMm = usableWidthMm;
      const fullImgHeightMm = (canvas.height * imgWidthMm) / canvas.width;

      const pdf = new jsPDF({ unit: "mm", format: "a4" });

      if (fullImgHeightMm <= usableHeightMm) {
        const imgData = canvas.toDataURL("image/png");
        pdf.addImage(imgData, "PNG", marginMm, marginMm, imgWidthMm, fullImgHeightMm);
      } else {
        const pageCanvasHeightPx = (usableHeightMm * canvas.width) / imgWidthMm;
        let renderedHeightPx = 0;
        let pageIndex = 0;

        while (renderedHeightPx < canvas.height) {
          const sliceHeightPx = Math.min(pageCanvasHeightPx, canvas.height - renderedHeightPx);

          const pageCanvas = document.createElement("canvas");
          pageCanvas.width = canvas.width;
          pageCanvas.height = sliceHeightPx;
          const ctx = pageCanvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
            ctx.drawImage(canvas, 0, renderedHeightPx, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx);
          }

          const sliceImgData = pageCanvas.toDataURL("image/png");
          const sliceHeightMm = (sliceHeightPx * imgWidthMm) / canvas.width;

          if (pageIndex > 0) pdf.addPage();
          pdf.addImage(sliceImgData, "PNG", marginMm, marginMm, imgWidthMm, sliceHeightMm);

          renderedHeightPx += sliceHeightPx;
          pageIndex++;
        }
      }

      pdf.save(`invoice-${orderNumber}.pdf`);
    } catch (e) {
      console.error(e);
      alert("خطا در ساخت فاکتور. دوباره امتحان کنید.");
    }
    setLoading(false);
  }

  return (
    <>
      <button onClick={handleDownload} disabled={loading} className="invoice-download-btn">
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
        {loading ? "در حال آماده‌سازی..." : "دانلود فاکتور PDF"}
      </button>

      <div style={{ position: "fixed", top: -99999, left: -99999 }}>
        <div ref={ref} className="invoice-template" dir="rtl">
          <div className="invoice-top-row">
            <div className="invoice-customer-block">
              <h2>مشخصات خریدار</h2>
              <p><strong>نام:</strong> {customerName}</p>
              <p><strong>آدرس:</strong> {address}</p>
              <p><strong>تلفن:</strong> {phone}</p>
            </div>
            <div className="invoice-brand-block">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="سبزفراز" className="invoice-logo" crossOrigin="anonymous" />
              ) : (
                <h1>سبزفراز</h1>
              )}
              <p>شماره سفارش / کد رهگیری:</p>
              <p className="invoice-order-number">{orderNumber}</p>
              <p>تاریخ: {new Date(createdAt).toLocaleDateString("fa-IR")}</p>
            </div>
          </div>

          <table className="invoice-table">
            <thead>
              <tr><th>ردیف</th><th>شرح کالا</th><th>ویژگی</th><th>تعداد</th><th>قیمت واحد</th><th>جمع</th></tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{item.name}</td>
                  <td>{item.variant || "—"}</td>
                  <td>{item.quantity}</td>
                  <td>{item.price.toLocaleString("fa-IR")}</td>
                  <td>{(item.price * item.quantity).toLocaleString("fa-IR")}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="invoice-totals">
            <p>جمع کالاها: {subtotal.toLocaleString("fa-IR")} تومان</p>
            <p>هزینه ارسال (تیپاکس): {shippingCost.toLocaleString("fa-IR")} تومان</p>
            <p className="invoice-grand-total">مبلغ نهایی پرداخت‌شده: {total.toLocaleString("fa-IR")} تومان</p>
          </div>

          <p className="invoice-footer">این فاکتور به‌صورت الکترونیکی از فروشگاه سبزفراز صادر شده است.</p>
        </div>
      </div>
    </>
  );
}