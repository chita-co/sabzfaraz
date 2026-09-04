"use client";

import { useRef, useEffect, useState } from "react";
import { Printer, Download } from "lucide-react";
import "../../app/admin/shipping-label.css";
import { saveTrackingCode } from "@/app/admin/orders/[id]/label-actions";

interface SenderInfo { name: string; phones: string[]; email: string | null; address: string; postalCode?: string | null; }
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
  orderId, orderNumber, sender, receiver, storeName, fileName, initialTrackingCode,
}: {
  orderId: string; orderNumber: string; date: string; sender: SenderInfo; receiver: ReceiverInfo;
  storeName: string; fileName: string; initialTrackingCode?: string | null;
}) {
  const qrRef = useRef<HTMLCanvasElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [trackingCode, setTrackingCode] = useState(initialTrackingCode ?? "");
  const [extraNote, setExtraNote] = useState("");

  // سایز برچسب کاملاً آزاد و قابل تنظیم دستی (میلی‌متر) — پیش‌فرض همون سایز قبلی
  const [widthMm, setWidthMm] = useState(148);
  const [heightMm, setHeightMm] = useState(105);

  // فیلدهای قابل‌ویرایش گیرنده و فرستنده — پیش‌فرض از دیتای سفارش، قابل اصلاح دستی قبل از چاپ
  const [senderName, setSenderName] = useState(sender.name);
  const [senderPhones, setSenderPhones] = useState(sender.phones.join(" - "));
  const [senderEmail, setSenderEmail] = useState(sender.email ?? "");
  const [senderAddress, setSenderAddress] = useState(sender.address);
  const [receiverName, setReceiverName] = useState(receiver.name);
  const [receiverPhone, setReceiverPhone] = useState(receiver.phone);
  const [receiverAddress, setReceiverAddress] = useState(receiver.addressLine);
  const [receiverProvinceCity, setReceiverProvinceCity] = useState(`${receiver.province}، ${receiver.city}`);

  const qrValue = trackingCode.trim() || orderNumber;

  const BASE_W = 148;
  const BASE_H = 110;
  const scaleX = widthMm / BASE_W;
  const scaleY = heightMm / BASE_H;

  useEffect(() => {
    let mounted = true;
    import("qrcode").then((QRCode) => {
      if (!mounted || !qrRef.current) return;
      QRCode.toCanvas(qrRef.current, qrValue, { width: 96, margin: 0, errorCorrectionLevel: "M" });
    });
    return () => { mounted = false; };
  }, [qrValue]);

  const postalDigits = (receiver.postalCode || "").padEnd(10, " ").split("").slice(0, 10);
  const senderPostalDigits = (sender.postalCode || "").padEnd(10, " ").split("").slice(0, 10);

  async function handleSaveTracking() {
    setSaving(true);
    await saveTrackingCode(orderId, trackingCode.trim());
    setSaving(false);
  }

  async function handleDownload() {
    if (!labelRef.current) return;
    setGenerating(true);
    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const { jsPDF } = await import("jspdf");
      const canvas = await html2canvas(labelRef.current, { scale: 3, backgroundColor: "#ffffff", useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const orientation = widthMm >= heightMm ? "landscape" : "portrait";
      const pdf = new jsPDF({ unit: "mm", format: [widthMm, heightMm], orientation });
      pdf.addImage(imgData, "PNG", 0, 0, widthMm, heightMm);
      pdf.save(fileName);
    } catch (e) {
      console.error(e);
      alert("خطا در ساخت PDF.");
    }
    setGenerating(false);
  }



  return (
    <div className="shipping-label-page">
      <style dangerouslySetInnerHTML={{ __html: `@media print { @page { size: ${widthMm}mm ${heightMm}mm; margin: 0; } }` }} />

      <div className="no-print sl-controls">
        <div className="sl-control-group">
          <label>سایز برچسب (میلی‌متر) — مثلاً برای بسته‌ی ۱۰×۱۲ سانتی‌متر: عرض ۱۰۰، ارتفاع ۱۲۰</label>
          <div className="sl-control-row">
            <input type="number" min={40} max={300} value={widthMm} onChange={(e) => setWidthMm(Number(e.target.value) || widthMm)} placeholder="عرض (mm)" />
            <span style={{ alignSelf: "center", color: "#6b7280" }}>×</span>
            <input type="number" min={40} max={300} value={heightMm} onChange={(e) => setHeightMm(Number(e.target.value) || heightMm)} placeholder="ارتفاع (mm)" />
          </div>
        </div>

        <div className="sl-control-group">
          <label>کد داخل QR (کد رهگیری واقعی، بعد از تحویل به پست/تیپاکس)</label>
          <div className="sl-control-row">
            <input type="text" dir="ltr" value={trackingCode} onChange={(e) => setTrackingCode(e.target.value)} placeholder="مثلاً 89012345678901" />
            <button onClick={handleSaveTracking} disabled={saving} className="admin-btn admin-btn-secondary">{saving ? "در حال ذخیره..." : "ذخیره"}</button>
          </div>
          {!trackingCode.trim() && <p className="sl-control-hint">فعلاً کد واقعی وارد نشده — QR موقتاً از شماره سفارش داخلی ساخته می‌شود.</p>}
        </div>

        <div className="sl-control-group">
          <label>توضیحات اضافه روی برچسب (اختیاری)</label>
          <textarea value={extraNote} onChange={(e) => setExtraNote(e.target.value)} placeholder="مثلاً: شکستنی، با احتیاط حمل شود..." rows={2} />
        </div>

        <details className="sl-control-group">
          <summary style={{ cursor: "pointer", fontWeight: 700, fontSize: 12.5, color: "#374151" }}>ویرایش دستی متن فرستنده / گیرنده</summary>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            <input value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="نام فرستنده" />
            <input value={senderPhones} onChange={(e) => setSenderPhones(e.target.value)} dir="ltr" placeholder="تلفن‌های فرستنده" />
            <input value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} dir="ltr" placeholder="ایمیل فرستنده" />
            <input value={senderAddress} onChange={(e) => setSenderAddress(e.target.value)} placeholder="آدرس فرستنده" />
            <hr style={{ border: "none", borderTop: "1px dashed #e5e7eb" }} />
            <input value={receiverName} onChange={(e) => setReceiverName(e.target.value)} placeholder="نام گیرنده" />
            <input value={receiverPhone} onChange={(e) => setReceiverPhone(e.target.value)} dir="ltr" placeholder="تلفن گیرنده" />
            <input value={receiverProvinceCity} onChange={(e) => setReceiverProvinceCity(e.target.value)} placeholder="استان / شهر" />
            <input value={receiverAddress} onChange={(e) => setReceiverAddress(e.target.value)} placeholder="آدرس کامل گیرنده" />
          </div>
        </details>
      </div>

      <div className="no-print flex gap-2 mb-4">
        <button onClick={() => window.print()} className="admin-btn admin-btn-primary flex items-center gap-2"><Printer size={16} /> چاپ مستقیم</button>
        <button onClick={handleDownload} disabled={generating} className="admin-btn admin-btn-secondary flex items-center gap-2"><Download size={16} /> {generating ? "در حال ساخت..." : "دانلود PDF"}</button>
      </div>

      <div className="shipping-label-preview-wrap">
        <div className="sl-card shipping-label-print" ref={labelRef} style={{ width: `${widthMm}mm`, height: `${heightMm}mm` }}>
          <div className="sl-card-inner" style={{ transform: `scale(${scaleX}, ${scaleY})` }}>
          <div className="sl-top-row">
            <div className="sl-sender-box">
              <span className="sl-badge sl-badge-left"><span dangerouslySetInnerHTML={{ __html: ICONS.person }} /> فرستنده</span>
              <p className="sl-sender-name">{senderName}</p>
              <p className="sl-line" dir="ltr"><span dangerouslySetInnerHTML={{ __html: ICONS.phone }} /> {senderPhones}</p>
              {senderEmail && <p className="sl-line" dir="ltr"><span dangerouslySetInnerHTML={{ __html: ICONS.mail }} /> {senderEmail}</p>}
              <p className="sl-line"><span dangerouslySetInnerHTML={{ __html: ICONS.pin }} /> {senderAddress}</p>
              {sender.postalCode && (
                <div className="sl-postal-row sl-postal-row-sender">
                  <b>کدپستی:</b>
                  <div className="sl-postal-boxes sl-postal-boxes-sm">
                    {senderPostalDigits.map((d, i) => <span key={i} className="sl-postal-box sl-postal-box-sm">{d.trim()}</span>)}
                  </div>
                </div>
              )}
            </div>

            <div className="sl-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-invoice.png" alt={storeName} style={{ height: 28, marginBottom: 2 }} />
              <h2 className="sl-brand">{storeName}</h2>
              <p className="sl-brand-site"><span dangerouslySetInnerHTML={{ __html: ICONS.globe }} /> sabzfaraz.ir</p>
            </div>

            <div className="sl-tracking-box">
              <canvas ref={qrRef} />
              <p className="sl-qr-instruction">ابتدا اسکن کنید<br />سپس بسته را باز کنید</p>
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
              {extraNote.trim() && <p className="sl-note-extra">{extraNote}</p>}
            </div>
            <div className="sl-receiver-box">
              <span className="sl-badge sl-badge-right"><span dangerouslySetInnerHTML={{ __html: ICONS.person }} /> گیرنده</span>
              <p className="sl-field">
                <b>نام و نام‌خانوادگی:</b> {receiverName}
                <span dir="ltr" style={{ marginRight: 8 }}><b>تلفن:</b> {receiverPhone}</span>
              </p>
              <div className="sl-postal-row">
                <b>کدپستی:</b>
                <div className="sl-postal-boxes">
                  {postalDigits.map((d, i) => <span key={i} className="sl-postal-box">{d.trim()}</span>)}
                </div>
              </div>
              <p className="sl-field"><b>استان/شهر:</b> {receiverProvinceCity}</p>
              <p className="sl-field"><b>آدرس کامل:</b> {receiverAddress}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}