"use client";

import { useRef, useEffect, useState } from "react";
import { Printer, Download } from "lucide-react";
import "../../app/admin/shipping-label.css";

interface SenderInfo { name: string; phones: string[]; email: string | null; address: string; }
interface ReceiverInfo { name: string; phone: string; postalCode: string; province: string; city: string; addressLine: string; }

const ICONS = {
  phone: `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1L6.6 10.8z"/></svg>`,
  mail: `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 6l10 7 10-7"/></svg>`,
  pin: `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s7-6.5 7-11a7 7 0 10-14 0c0 4.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>`,
  globe: `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><line x1="3" y1="12" x2="21" y2="12"/><path d="M12 3a15 15 0 010 18 15 15 0 010-18z"/></svg>`,
  person: `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z"/><path d="M8.5 12l2.5 2.5 4.5-4.5"/></svg>`,
  truck: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="1" y="6" width="13" height="10" rx="1"/><path d="M14 10h4l3 3v3h-7z"/><circle cx="5" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/></svg>`,
  headset: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 12a8 8 0 0116 0v5a2 2 0 01-2 2h-1v-6h3"/><rect x="2" y="14" width="4" height="6" rx="1"/><rect x="18" y="14" width="4" height="6" rx="1"/></svg>`,
  hands: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 14V6a2 2 0 114 0v6M11 12V4a2 2 0 114 0v8M15 12V6a2 2 0 114 0v7c0 4-3 7-7 7h-1c-3 0-4-1-6-4l-2-3a1.5 1.5 0 012-2l2 1.5"/></svg>`,
  box: `<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>`,
};

export default function AdminShippingLabelView({
  orderNumber, date, sender, receiver, storeName, fileName,
}: {
  orderNumber: string; date: string; sender: SenderInfo; receiver: ReceiverInfo; storeName: string; fileName: string;
}) {
  const barcodeRef = useRef<HTMLCanvasElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    let mounted = true;
    import("jsbarcode").then((mod) => {
      if (!mounted || !barcodeRef.current) return;
      mod.default(barcodeRef.current, orderNumber, { format: "CODE128", displayValue: false, height: 32, margin: 0 });
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
        <div className="sl-card shipping-label-print" ref={labelRef}>
          <div className="sl-top-row">
            <div className="sl-sender-box">
              <span className="sl-badge sl-badge-left"><span dangerouslySetInnerHTML={{ __html: ICONS.person }} /> فرستنده</span>
              <p className="sl-sender-name">{storeName}</p>
              <p className="sl-line" dir="ltr"><span dangerouslySetInnerHTML={{ __html: ICONS.phone }} /> {sender.phones.join(" - ")}</p>
              {sender.email && <p className="sl-line" dir="ltr"><span dangerouslySetInnerHTML={{ __html: ICONS.mail }} /> {sender.email}</p>}
              <p className="sl-line"><span dangerouslySetInnerHTML={{ __html: ICONS.pin }} /> {sender.address}</p>
            </div>

            <div className="sl-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
  <img src="/logo-invoice.png" alt={storeName} style={{ height: 28, marginBottom: 2 }} />
              <h2 className="sl-brand">{storeName}</h2>
              <p className="sl-brand-site"><span dangerouslySetInnerHTML={{ __html: ICONS.globe }} /> sabzfaraz.ir</p>
            </div>

            <div className="sl-tracking-box">
              <p className="sl-tracking-title">شماره مرسوله</p>
              <canvas ref={barcodeRef} />
              <div className="sl-tracking-divider" />
              <p className="sl-tracking-date">تاریخ: {date}</p>
            </div>
          </div>

          <div className="sl-trust-row">
            <div><span dangerouslySetInnerHTML={{ __html: ICONS.shield }} /><b>بسته‌بندی مطمئن</b><span>با بهترین کیفیت</span></div>
            <div><span dangerouslySetInnerHTML={{ __html: ICONS.truck }} /><b>ارسال سریع</b><span>به سراسر کشور</span></div>
            <div><span dangerouslySetInnerHTML={{ __html: ICONS.headset }} /><b>پشتیبانی مطمئن</b><span>پاسخگوی نیاز شما</span></div>
            <div><span dangerouslySetInnerHTML={{ __html: ICONS.hands }} /><b>از اعتماد شما</b><span>سپاسگزاریم</span></div>
          </div>

          <div className="sl-bottom-row">
            <div className="sl-package-note">
              <span dangerouslySetInnerHTML={{ __html: ICONS.box }} />
              <p>لطفاً با احتیاط حمل شود</p>
              <div className="sl-note-divider" />
              <p className="sl-note-title">توضیحات / محتویات</p>
            </div>
            <div className="sl-receiver-box">
              <span className="sl-badge sl-badge-right"><span dangerouslySetInnerHTML={{ __html: ICONS.person }} /> گیرنده</span>
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