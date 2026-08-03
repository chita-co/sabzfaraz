export interface InvoiceItem {
  name: string;
  variant?: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceParams {
  type: "proforma" | "final";
  invoiceNumber: string;
  date: string;
  validUntil?: string;
  storeName: string;
  storePhones: string[];
  storeAddress: string;
  logoDataUri: string | null;
  buyerName: string;
  buyerPhone: string;
  buyerAddress: string;
  items: InvoiceItem[];
  subtotal: number;
  shippingCost: number;
}

export function buildInvoiceHtml(p: InvoiceParams): string {
  const total = p.subtotal + p.shippingCost;
  const headerLabel = p.type === "proforma" ? "پیش‌فاکتور" : "فاکتور خرید";
  const headerColor = p.type === "proforma" ? "#b45309" : "#15803d";
  const headerBg = p.type === "proforma" ? "#fef3c7" : "#dcfce7";

  return `
    <div style="width:700px; padding:32px; background:#ffffff; font-family:Tahoma, Arial, sans-serif; color:#111827; direction:rtl; box-sizing:border-box;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #15803d; padding-bottom:16px; margin-bottom:20px; gap:20px;">
        <div style="text-align:right; font-size:13px; line-height:2;">
          <h2 style="font-size:14px; font-weight:700; color:#15803d; margin:0 0 6px;">مشخصات خریدار</h2>
          <p style="margin:2px 0;">نام: ${p.buyerName}</p>
          <p style="margin:2px 0;" dir="ltr">تلفن: ${p.buyerPhone}</p>
          <p style="margin:2px 0;">آدرس: ${p.buyerAddress}</p>
        </div>
        <div style="text-align:left; font-size:12px; line-height:1.9; color:#6b7280; white-space:nowrap;">
          ${p.logoDataUri ? `<img src="${p.logoDataUri}" style="height:40px; width:auto; margin-bottom:8px; margin-left:auto; display:block;" />` : ""}
          <h1 style="color:#15803d; font-size:20px; font-weight:800; margin:0 0 6px;">${p.storeName}</h1>
          ${p.storePhones.map((ph) => `<p style="margin:2px 0;" dir="ltr">${ph}</p>`).join("")}
          <p style="margin:2px 0;">${p.storeAddress}</p>
        </div>
      </div>

      <div style="text-align:center; margin-bottom:18px;">
        <span style="display:inline-block; background:${headerBg}; color:${headerColor}; font-weight:800; padding:6px 22px; border-radius:8px; font-size:15px;">${headerLabel}</span>
        <p style="font-size:11px; color:#9ca3af; margin:8px 0 2px;">
          شماره ${p.type === "proforma" ? "پیش‌فاکتور" : "سفارش"}: <span dir="ltr" style="font-weight:700; color:#111827;">${p.invoiceNumber}</span>
          &nbsp;|&nbsp; تاریخ صدور: ${p.date}
          ${p.validUntil ? `&nbsp;|&nbsp; اعتبار تا: ${p.validUntil}` : ""}
        </p>
      </div>

      <table style="width:100%; border-collapse:collapse; margin:16px 0; font-size:12.5px;">
        <thead>
          <tr>
            <th style="background:#f0fdf4; color:#15803d; padding:8px 10px; text-align:right; border-bottom:2px solid #d1fae5;">ردیف</th>
            <th style="background:#f0fdf4; color:#15803d; padding:8px 10px; text-align:right; border-bottom:2px solid #d1fae5;">شرح کالا</th>
            <th style="background:#f0fdf4; color:#15803d; padding:8px 10px; text-align:right; border-bottom:2px solid #d1fae5;">تعداد</th>
            <th style="background:#f0fdf4; color:#15803d; padding:8px 10px; text-align:right; border-bottom:2px solid #d1fae5;">قیمت واحد</th>
            <th style="background:#f0fdf4; color:#15803d; padding:8px 10px; text-align:right; border-bottom:2px solid #d1fae5;">جمع</th>
          </tr>
        </thead>
        <tbody>
          ${p.items
            .map(
              (item, i) => `
            <tr>
              <td style="padding:8px 10px; border-bottom:1px solid #f3f4f6;">${(i + 1).toLocaleString("fa-IR")}</td>
              <td style="padding:8px 10px; border-bottom:1px solid #f3f4f6;">
                ${item.name}
                ${item.variant ? `<div style="font-size:10.5px; color:#9ca3af; margin-top:2px;">${item.variant}</div>` : ""}
              </td>
              <td style="padding:8px 10px; border-bottom:1px solid #f3f4f6;">${item.quantity.toLocaleString("fa-IR")}</td>
              <td style="padding:8px 10px; border-bottom:1px solid #f3f4f6;">${item.unitPrice.toLocaleString("fa-IR")}</td>
              <td style="padding:8px 10px; border-bottom:1px solid #f3f4f6;">${(item.unitPrice * item.quantity).toLocaleString("fa-IR")}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>

      <div style="text-align:left; font-size:13px; line-height:2; margin-top:10px;">
        <p style="margin:2px 0;">جمع کالاها: ${p.subtotal.toLocaleString("fa-IR")} تومان</p>
        <p style="margin:2px 0;">هزینه ارسال و بسته‌بندی: ${p.shippingCost.toLocaleString("fa-IR")} تومان</p>
        <p style="margin:6px 0 0; font-size:16px; font-weight:800; color:#15803d;">مبلغ ${
          p.type === "proforma" ? "قابل پرداخت" : "پرداخت‌شده"
        }: ${total.toLocaleString("fa-IR")} تومان</p>
      </div>

      <p style="text-align:center; font-size:11px; color:#9ca3af; margin-top:20px;">
        ${
          p.type === "proforma"
            ? "این سند پیش‌فاکتور است و صرفاً جهت اطلاع از مبلغ نهایی صادر شده؛ فاکتور رسمی پس از پرداخت صادر می‌شود."
            : "این فاکتور به‌صورت الکترونیکی صادر شده و نیاز به مهر و امضا ندارد."
        }
      </p>

      <div style="margin-top:30px; padding-top:14px; border-top:2px dashed #9ca3af; position:relative;">
        <span style="position:absolute; top:-11px; right:50%; transform:translateX(50%); background:#ffffff; padding:0 10px; font-size:10px; color:#9ca3af;">✂ از این خط جدا کنید — برچسب مرسوله</span>
        <div style="display:flex; justify-content:space-between; gap:20px; font-size:11.5px; margin-top:12px;">
          <div style="text-align:right; line-height:1.9;">
            <p style="margin:0 0 4px; font-weight:700; color:#374151;">گیرنده</p>
            <p style="margin:1px 0;">${p.buyerName}</p>
            <p style="margin:1px 0;" dir="ltr">${p.buyerPhone}</p>
            <p style="margin:1px 0;">${p.buyerAddress}</p>
          </div>
          <div style="text-align:left; line-height:1.9;">
            <p style="margin:0 0 4px; font-weight:700; color:#374151;">فرستنده</p>
            <p style="margin:1px 0;">${p.storeName}</p>
            <p style="margin:1px 0;" dir="ltr">${p.storePhones[0] ?? ""}</p>
            <p style="margin:1px 0;">${p.storeAddress}</p>
          </div>
        </div>
        <p style="text-align:center; font-size:10px; color:#9ca3af; margin-top:10px;" dir="ltr">Order: ${p.invoiceNumber}</p>
      </div>
    </div>
  `;
}