"use client";

import { useRef, useEffect, useState } from "react";
import { Printer, Download } from "lucide-react";
import "../../app/admin/shipping-label.css";

interface PartyInfo { name: string; phone: string; address?: string; }
interface ReceiverInfo { name: string; phone: string; postalCode: string; province: string; city: string; addressLine: string; }

export default function AdminShippingLabelView({
  orderNumber, date, sender, receiver, fileName,
}: {
  orderNumber: string; date: string; sender: PartyInfo; receiver: ReceiverInfo; fileName: string;
}) {
  const barcodeRef = useRef<HTMLCanvasElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    let mounted = true;
    import("jsbarcode").then((mod) => {
      if (!mounted || !barcodeRef.current) return;
      mod.default(barcodeRef.current, orderNumber, { format: "CODE128", displayValue: false, height: 30, margin: 0 });
    });
    return () => { mounted = false; };
  }, [orderNumber]);

  const postalDigits = (receiver.postalCode || "").padEnd(10, " ").split("").slice(0, 10);

  async function handleDownload() {
    if (!labelRef.current) return;
    setGenerating(true);
    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const { jsPDF } = await import("jspdf");
      const canvas = await html2canvas(labelRef.current, { scale: 3, backgroundColor: "#ffffff", useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ unit: "mm", format: [148, 105], orientation: "landscape" });
      pdf.addImage(imgData, "PNG", 0, 0, 148, 105);
      pdf.save(fileName);
    } catch (e) {
      console.error(e);
      alert("خطا در ساخت PDF.");
    }
    setGenerating(false);
  }

  return (
    <div className="shipping-label-page">
      <div className="no-print flex gap-2 mb-4">
        <button onClick={() => window.print()} className="admin-btn admin-btn-primary flex items-center gap-2"><Printer size={16} /> چاپ مستقیم</button>
        <button onClick={handleDownload} disabled={generating} className="admin-btn admin-btn-secondary flex items-center gap-2"><Download size={16} /> {generating ? "در حال ساخت..." : "دانلود PDF"}</button>
      </div>

      <div className="shipping-label-preview-wrap">
        <div className="shipping-label-a6 shipping-label-print" ref={labelRef}>
          <div className="sl-top-row">
            <div className="sl-sender-box">
              <p className="sl-box-title">فرستنده</p>
              <p className="sl-sender-name">{sender.name}</p>
              <p className="sl-line" dir="ltr">{sender.phone}</p>
              {sender.address && <p className="sl-line">{sender.address}</p>}
            </div>
            <div className="sl-tracking-box">
              <p className="sl-tracking-title">شماره مرسوله</p>
              <canvas ref={barcodeRef} />
              <p className="sl-tracking-number" dir="ltr">{orderNumber}</p>
              <p className="sl-tracking-date">تاریخ: {date}</p>
            </div>
          </div>

          <div className="sl-trust-row">
            <span>بسته‌بندی مطمئن</span>
            <span>ارسال سریع</span>
            <span>پشتیبانی مطمئن</span>
            <span>از اعتماد شما سپاسگزاریم</span>
          </div>

          <div className="sl-bottom-row">
            <div className="sl-package-note">
              <div className="sl-package-icon">⬛</div>
              <p>لطفاً با احتیاط حمل شود</p>
            </div>
            <div className="sl-receiver-box">
              <p className="sl-box-title">گیرنده</p>
              <p className="sl-field"><b>نام و نام‌خانوادگی:</b> {receiver.name}</p>
              <p className="sl-field" dir="ltr"><b>تلفن همراه:</b> {receiver.phone}</p>
              <div className="sl-postal-row">
                <b>کدپستی:</b>
                <div className="sl-postal-boxes">
                  {postalDigits.map((d, i) => <span key={i} className="sl-postal-box">{d.trim()}</span>)}
                </div>
              </div>
              <p className="sl-field"><b>استان/شهر:</b> {receiver.province}، {receiver.city}</p>
              <p className="sl-field"><b>آدرس کامل:</b> {receiver.addressLine}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}