export interface InvoiceItem {
  name: string;
  variant?: string;
  quantity: number;
  unitPrice: number;
  unitLabel?: string;
}

export interface InvoiceParams {
  type: "proforma" | "final";
  invoiceNumber: string;
  date: string;
  time?: string;
  trackingCode?: string;
  validUntil?: string;
  storeName: string;
  storePhones: string[];
  storeAddress: string;
  logoDataUri: string | null;
  buyerName: string;
  buyerCompanyName?: string;
  buyerNationalId?: string;
  buyerPhone: string;
  buyerAddress: string;
  paymentMethodLabel?: string;
  items: InvoiceItem[];
  subtotal: number;
  shippingCost: number;
  discountAmount?: number;
  note?: string;
}

const RIAL = 10;
const toRial = (toman: number) => Math.round(toman * RIAL).toLocaleString("fa-IR");

const ICONS: Record<string, string> = {
  globe: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><line x1="3" y1="12" x2="21" y2="12"/><path d="M12 3a15 15 0 010 18 15 15 0 010-18z"/></svg>`,
  phone: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1L6.6 10.8z"/></svg>`,
  mail: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 6l10 7 10-7"/></svg>`,
  pin: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s7-6.5 7-11a7 7 0 10-14 0c0 4.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z"/><path d="M8.5 12l2.5 2.5 4.5-4.5"/></svg>`,
  truck: `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="1" y="6" width="13" height="10" rx="1"/><path d="M14 10h4l3 3v3h-7z"/><circle cx="5" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/></svg>`,
  headset: `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 12a8 8 0 0116 0v5a2 2 0 01-2 2h-1v-6h3"/><rect x="2" y="14" width="4" height="6" rx="1"/><rect x="18" y="14" width="4" height="6" rx="1"/></svg>`,
  card: `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>`,
};

function cornerBrackets(): string {
  const style = "position:absolute; width:12mm; height:12mm; border-color:#111827;";
  return `
    <span style="${style} top:6mm; right:6mm; border-top:2.5px solid; border-right:2.5px solid;"></span>
    <span style="${style} top:6mm; left:6mm; border-top:2.5px solid; border-left:2.5px solid;"></span>
    <span style="${style} bottom:6mm; right:6mm; border-bottom:2.5px solid; border-right:2.5px solid;"></span>
    <span style="${style} bottom:6mm; left:6mm; border-bottom:2.5px solid; border-left:2.5px solid;"></span>
  `;
}

export function buildInvoiceHtml(p: InvoiceParams): string {
  const discount = p.discountAmount ?? 0;
  const total = p.subtotal - discount + p.shippingCost;
  const headerLabel = p.type === "proforma" ? "پیش‌فاکتور" : "فاکتور فروش";

  return `
    <div style="position:relative; width:210mm; box-sizing:border-box; padding:14mm 10mm; background:#ffffff; font-family:Tahoma, Arial, sans-serif; color:#111827; direction:rtl;">
      ${cornerBrackets()}

      <div style="direction:ltr; display:flex; align-items:flex-start; justify-content:space-between; gap:6mm;">
        <div style="direction:rtl; text-align:right; border:1.5px dashed #9ca3af; border-radius:10px; padding:6px 14px; font-size:10.5px; line-height:2.1; min-width:44mm;">
          <p style="margin:0;">شماره فاکتور: <b>${p.invoiceNumber}</b></p>
          <p style="margin:0;">تاریخ: ${p.date}</p>
          ${p.time ? `<p style="margin:0;">ساعت: ${p.time}</p>` : ""}
          ${p.trackingCode ? `<p style="margin:0;">شماره پیگیری: ${p.trackingCode}</p>` : ""}
          ${p.validUntil ? `<p style="margin:0; color:#b45309;">اعتبار تا: ${p.validUntil}</p>` : ""}
        </div>

        <div style="text-align:center; flex-shrink:0;">
  <img src="/logo-invoice.png" alt="${p.storeName}" style="height:56px; margin-bottom:4px;" />
  <h1 style="font-size:20px; font-weight:800; color:#111827; margin:0;">${p.storeName}</h1>
</div>

        <div style="direction:rtl; text-align:right; font-size:10.5px; line-height:2.1; min-width:44mm;">
          <p style="margin:0; display:flex; align-items:center; gap:6px; color:#15803d;">${ICONS.globe} <span dir="ltr">sabzfaraz.ir</span></p>
          ${p.storePhones.map((ph) => `<p style="margin:0; display:flex; align-items:center; gap:6px; color:#15803d;">${ICONS.phone} <span dir="ltr">${ph}</span></p>`).join("")}
          <p style="margin:0; display:flex; align-items:center; gap:6px; color:#15803d;">${ICONS.pin} ${p.storeAddress}</p>
        </div>
      </div>

      <div style="text-align:center; margin:6mm 0 3mm;">
        <span style="display:inline-block; border:2px solid #111827; border-radius:10px; padding:5px 34px; font-size:19px; font-weight:800;">${headerLabel}</span>
      </div>
      <p style="text-align:center; font-size:11px; color:#4b5563; margin:0 0 6mm;">${p.storeName}</p>

      <div style="border:1.5px solid #111827; border-radius:8px; margin-bottom:5mm; overflow:hidden;">
        <div style="direction:ltr; display:flex; border-bottom:1px solid #d1d5db;">
          <div style="direction:rtl; flex:1; padding:6px 12px; font-size:11px; border-left:1px solid #d1d5db;"><b>شماره تماس:</b> <span dir="ltr">${p.buyerPhone}</span></div>
          <div style="direction:rtl; flex:1; padding:6px 12px; font-size:11px;"><b>خریدار:</b> ${p.buyerName}</div>
        </div>
        <div style="direction:ltr; display:flex; border-bottom:1px solid #d1d5db;">
          <div style="direction:rtl; flex:1; padding:6px 12px; font-size:11px; border-left:1px solid #d1d5db;"><b>آدرس:</b> ${p.buyerAddress}</div>
          <div style="direction:rtl; flex:1; padding:6px 12px; font-size:11px;"><b>نام شخص / شرکت:</b> ${p.buyerCompanyName ?? "—"}</div>
        </div>
        <div style="direction:ltr; display:flex;">
          <div style="direction:rtl; flex:1; padding:6px 12px; font-size:11px; border-left:1px solid #d1d5db;"><b>روش پرداخت:</b> ${p.paymentMethodLabel ?? "—"}</div>
          <div style="direction:rtl; flex:1; padding:6px 12px; font-size:11px;"><b>کد ملی / شناسه ملی:</b> ${p.buyerNationalId ?? "—"}</div>
        </div>
      </div>

      <table style="width:100%; border-collapse:collapse; font-size:10.5px; margin-bottom:5mm;">
        <thead>
          <tr style="background:#111827; color:#fff;">
            <th style="padding:6px; border:1px solid #111827;">ردیف</th>
            <th style="padding:6px; border:1px solid #111827;">نام کالا / خدمات</th>
            <th style="padding:6px; border:1px solid #111827;">سایز / مشخصات</th>
            <th style="padding:6px; border:1px solid #111827;">تعداد</th>
            <th style="padding:6px; border:1px solid #111827;">واحد</th>
            <th style="padding:6px; border:1px solid #111827;">قیمت واحد (ریال)</th>
            <th style="padding:6px; border:1px solid #111827;">مبلغ کل (ریال)</th>
          </tr>
        </thead>
        <tbody>
          ${p.items
            .map(
              (item, i) => `
            <tr>
              <td style="padding:6px; border:1px solid #d1d5db; text-align:center;">${(i + 1).toLocaleString("fa-IR")}</td>
              <td style="padding:6px; border:1px solid #d1d5db;">${item.name}</td>
              <td style="padding:6px; border:1px solid #d1d5db; text-align:center;">${item.variant ?? "—"}</td>
              <td style="padding:6px; border:1px solid #d1d5db; text-align:center;">${item.quantity.toLocaleString("fa-IR")}</td>
              <td style="padding:6px; border:1px solid #d1d5db; text-align:center;">${item.unitLabel ?? "عدد"}</td>
              <td style="padding:6px; border:1px solid #d1d5db; text-align:center;">${toRial(item.unitPrice)}</td>
              <td style="padding:6px; border:1px solid #d1d5db; text-align:center; font-weight:700;">${toRial(item.unitPrice * item.quantity)}</td>
            </tr>
          `
            )
            .join("")}
          <tr>
            <td colspan="6" style="padding:6px; border:1px solid #111827; background:#f3f4f6; font-weight:800; text-align:left;">جمع کل (ریال)</td>
            <td style="padding:6px; border:1px solid #111827; background:#f3f4f6; font-weight:800; text-align:center;">${toRial(p.subtotal)}</td>
          </tr>
        </tbody>
      </table>

      <div style="direction:ltr; display:flex; gap:5mm; margin-bottom:6mm; align-items:stretch;">
        <table style="direction:rtl; width:56mm; border-collapse:collapse; font-size:10.5px; flex-shrink:0;">
          <tr><td style="padding:6px; border:1px solid #d1d5db; background:#f9fafb;">جمع کل (ریال)</td><td style="padding:6px; border:1px solid #d1d5db; text-align:left;">${toRial(p.subtotal)}</td></tr>
          <tr><td style="padding:6px; border:1px solid #d1d5db; background:#f9fafb;">تخفیف (ریال)</td><td style="padding:6px; border:1px solid #d1d5db; text-align:left;">${toRial(discount)}</td></tr>
          <tr><td style="padding:6px; border:1px solid #d1d5db; background:#f9fafb;">هزینه ارسال (ریال)</td><td style="padding:6px; border:1px solid #d1d5db; text-align:left;">${toRial(p.shippingCost)}</td></tr>
          <tr><td style="padding:6px; border:1px solid #111827; background:#111827; color:#fff; font-weight:800;">مبلغ قابل پرداخت (ریال)</td><td style="padding:6px; border:1px solid #111827; background:#f3f4f6; text-align:left; font-weight:800;">${toRial(total)}</td></tr>
        </table>

        <div style="direction:rtl; flex:1; border:1px solid #d1d5db; border-radius:8px; padding:8px 12px; font-size:10.5px; color:#4b5563;">
          <b style="display:block; margin-bottom:4px;">توضیحات:</b>
          ${p.note ? p.note : "—"}
        </div>

        <div style="direction:rtl; width:38mm; flex-shrink:0; text-align:center; border:1px solid #d1d5db; border-radius:8px; padding:8px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:5px;">
          <span style="font-size:10.5px; font-weight:700;">مهر و امضاء فروشگاه</span>
          <span style="width:40px; height:40px; border-radius:50%; border:2px solid #15803d; color:#15803d; display:flex; align-items:center; justify-content:center;">${ICONS.shield}</span>
        </div>
      </div>

      <div style="direction:ltr; border-top:2px solid #111827; padding-top:5mm; display:flex; align-items:center; gap:4mm;">
        <div style="flex:1; text-align:center; color:#374151;"><span style="color:#15803d;">${ICONS.shield}</span><p style="margin:3px 0 0; font-size:9px; font-weight:700;">ضمانت اصالت کالا</p><p style="margin:0; font-size:8px; color:#6b7280;">تضمین کیفیت و اصالت</p></div>
        <div style="flex:1; text-align:center; color:#374151;"><span style="color:#15803d;">${ICONS.truck}</span><p style="margin:3px 0 0; font-size:9px; font-weight:700;">ارسال سریع</p><p style="margin:0; font-size:8px; color:#6b7280;">ارسال به سراسر کشور</p></div>
        <div style="flex:1; text-align:center; color:#374151;"><span style="color:#15803d;">${ICONS.headset}</span><p style="margin:3px 0 0; font-size:9px; font-weight:700;">پشتیبانی مطمئن</p><p style="margin:0; font-size:8px; color:#6b7280;">پاسخگوی نیاز شما</p></div>
        <div style="flex:1; text-align:center; color:#374151;"><span style="color:#15803d;">${ICONS.card}</span><p style="margin:3px 0 0; font-size:9px; font-weight:700;">پرداخت امن</p><p style="margin:0; font-size:8px; color:#6b7280;">درگاه پرداخت معتبر</p></div>
        <div style="direction:rtl; flex:1.4; text-align:center; border:1px solid #d1d5db; border-radius:10px; padding:6px 8px; font-size:9.5px; font-weight:700; color:#111827;">
          از اعتماد شما سپاسگزاریم<br/>${p.storeName}، سبز بمانید
        </div>
      </div>
    </div>
  `;
}