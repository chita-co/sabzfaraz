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
  buyerPhone: string;
  buyerAddress: string;
  paymentMethodLabel?: string;
  items: InvoiceItem[];
  subtotal: number;
  shippingCost: number;
  discountAmount?: number;
  note?: string;
}

const ICONS: Record<string, string> = {
  globe: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><line x1="3" y1="12" x2="21" y2="12"/><path d="M12 3a15 15 0 010 18 15 15 0 010-18z"/></svg>`,
  phone: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1L6.6 10.8z"/></svg>`,
  mail: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 6l10 7 10-7"/></svg>`,
  pin: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s7-6.5 7-11a7 7 0 10-14 0c0 4.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>`,
  badge: `<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z"/><path d="M8.5 12l2.5 2.5 4.5-4.5"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z"/><path d="M8.5 12l2.5 2.5 4.5-4.5"/></svg>`,
  truck: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="6" width="13" height="10" rx="1"/><path d="M14 10h4l3 3v3h-7z"/><circle cx="5" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/></svg>`,
  headset: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12a8 8 0 0116 0v5a2 2 0 01-2 2h-1v-6h3"/><rect x="2" y="14" width="4" height="6" rx="1"/><rect x="18" y="14" width="4" height="6" rx="1"/></svg>`,
  card: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>`,
};

export function buildInvoiceHtml(p: InvoiceParams): string {
  const discount = p.discountAmount ?? 0;
  const total = p.subtotal - discount + p.shippingCost;
  const headerLabel = p.type === "proforma" ? "پیش‌فاکتور" : "فاکتور فروش";

  return `
    <div style="width:210mm; box-sizing:border-box; padding:10mm; background:#ffffff; font-family:Tahoma, Arial, sans-serif; color:#111827; direction:rtl; border:1.5px solid #111827;">

      <div style="display:flex; justify-content:space-between; align-items:flex-start; padding-bottom:6mm; border-bottom:2px solid #111827;">
        <div style="border:1px dashed #9ca3af; border-radius:8px; padding:8px 14px; font-size:11px; line-height:2.1; min-width:150px;">
          <p style="margin:0;">شماره فاکتور: <b>${p.invoiceNumber}</b></p>
          <p style="margin:0;">تاریخ: ${p.date}</p>
          ${p.time ? `<p style="margin:0;">ساعت: ${p.time}</p>` : ""}
          ${p.trackingCode ? `<p style="margin:0;">شماره پیگیری: ${p.trackingCode}</p>` : ""}
          ${p.validUntil ? `<p style="margin:0; color:#b45309;">اعتبار تا: ${p.validUntil}</p>` : ""}
        </div>

        <div style="text-align:center;">
          ${p.logoDataUri ? `<img src="${p.logoDataUri}" style="height:44px; margin-bottom:4px;" />` : ""}
          <h1 style="font-size:20px; font-weight:800; color:#15803d; margin:0;">${p.storeName}</h1>
        </div>

        <div style="font-size:10.5px; line-height:2.1; text-align:left;">
          <p style="margin:0; display:flex; align-items:center; gap:6px; justify-content:flex-end; color:#15803d;">${ICONS.globe} <span dir="ltr">sabzfaraz.ir</span></p>
          ${p.storePhones.map((ph) => `<p style="margin:0; display:flex; align-items:center; gap:6px; justify-content:flex-end; color:#15803d;">${ICONS.phone} <span dir="ltr">${ph}</span></p>`).join("")}
          <p style="margin:0; display:flex; align-items:center; gap:6px; justify-content:flex-end; color:#15803d;">${ICONS.pin} ${p.storeAddress}</p>
        </div>
      </div>

      <div style="text-align:center; margin:6mm 0;">
        <span style="display:inline-block; border:2px solid #111827; border-radius:10px; padding:6px 30px; font-size:17px; font-weight:800;">${headerLabel}</span>
        <p style="font-size:10.5px; color:#6b7280; margin-top:6px;">${p.storeName} — فروشگاه اینترنتی تخصصی الکترونیک</p>
      </div>

      <div style="display:flex; gap:10mm; font-size:11px; margin-bottom:5mm; border:1px solid #d1d5db; border-radius:8px; padding:8px 12px;">
        <div style="flex:1;"><b>خریدار:</b> ${p.buyerName}</div>
        <div style="flex:1;"><b>شماره تماس:</b> <span dir="ltr">${p.buyerPhone}</span></div>
        ${p.paymentMethodLabel ? `<div style="flex:1;"><b>روش پرداخت:</b> ${p.paymentMethodLabel}</div>` : ""}
      </div>
      <div style="font-size:11px; margin-bottom:6mm; border:1px solid #d1d5db; border-radius:8px; padding:8px 12px;">
        <b>آدرس:</b> ${p.buyerAddress}
      </div>

      <table style="width:100%; border-collapse:collapse; font-size:10.5px; margin-bottom:5mm;">
        <thead>
          <tr style="background:#111827; color:#fff;">
            <th style="padding:6px; border:1px solid #111827;">ردیف</th>
            <th style="padding:6px; border:1px solid #111827;">نام کالا / خدمات</th>
            <th style="padding:6px; border:1px solid #111827;">سایز / مشخصات</th>
            <th style="padding:6px; border:1px solid #111827;">تعداد</th>
            <th style="padding:6px; border:1px solid #111827;">واحد</th>
            <th style="padding:6px; border:1px solid #111827;">قیمت واحد (تومان)</th>
            <th style="padding:6px; border:1px solid #111827;">مبلغ کل (تومان)</th>
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
              <td style="padding:6px; border:1px solid #d1d5db; text-align:center;">${item.unitPrice.toLocaleString("fa-IR")}</td>
              <td style="padding:6px; border:1px solid #d1d5db; text-align:center; font-weight:700;">${(item.unitPrice * item.quantity).toLocaleString("fa-IR")}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>

      <div style="display:flex; gap:8mm; margin-bottom:6mm;">
        <table style="width:60mm; border-collapse:collapse; font-size:11px;">
          <tr><td style="padding:6px; border:1px solid #d1d5db; background:#f3f4f6;">جمع کل (تومان)</td><td style="padding:6px; border:1px solid #d1d5db; text-align:left;">${p.subtotal.toLocaleString("fa-IR")}</td></tr>
          <tr><td style="padding:6px; border:1px solid #d1d5db; background:#f3f4f6;">تخفیف (تومان)</td><td style="padding:6px; border:1px solid #d1d5db; text-align:left;">${discount.toLocaleString("fa-IR")}</td></tr>
          <tr><td style="padding:6px; border:1px solid #d1d5db; background:#f3f4f6;">هزینه ارسال (تومان)</td><td style="padding:6px; border:1px solid #d1d5db; text-align:left;">${p.shippingCost.toLocaleString("fa-IR")}</td></tr>
          <tr><td style="padding:6px; border:1px solid #111827; background:#111827; color:#fff; font-weight:700;">مبلغ قابل پرداخت</td><td style="padding:6px; border:1px solid #111827; text-align:left; font-weight:800;">${total.toLocaleString("fa-IR")}</td></tr>
        </table>

        <div style="flex:1; border:1px solid #d1d5db; border-radius:8px; padding:8px 12px; font-size:10.5px; color:#4b5563;">
          <b style="display:block; margin-bottom:4px;">توضیحات:</b>
          ${p.note ? p.note : "—"}
        </div>

        <div style="width:40mm; text-align:center; border:1px solid #d1d5db; border-radius:8px; padding:10px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px;">
          <span style="color:#15803d;">${ICONS.badge}</span>
          <span style="font-size:10px; font-weight:700;">مهر و امضاء فروشگاه</span>
        </div>
      </div>

      <div style="border-top:2px solid #111827; padding-top:5mm; display:flex; justify-content:space-around; font-size:9.5px; color:#374151; text-align:center;">
        <div><span style="color:#15803d;">${ICONS.shield}</span><p style="margin:2px 0 0;">ضمانت اصالت کالا</p></div>
        <div><span style="color:#15803d;">${ICONS.truck}</span><p style="margin:2px 0 0;">ارسال سریع</p></div>
        <div><span style="color:#15803d;">${ICONS.headset}</span><p style="margin:2px 0 0;">پشتیبانی مطمئن</p></div>
        <div><span style="color:#15803d;">${ICONS.card}</span><p style="margin:2px 0 0;">پرداخت امن</p></div>
        <div style="font-weight:700; color:#15803d;">از اعتماد شما سپاسگزاریم<br/>${p.storeName}، سبز بمانید</div>
      </div>
    </div>
  `;
}