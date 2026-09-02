"use client";

import { useState } from "react";

interface GatewayBadge {
  key: string;
  img: string;
  alt: string;
  label: string;
  title: string;
  description: string[];
}

const BADGES: GatewayBadge[] = [
  {
    key: "saman",
    img: "/badges/saman.jpg",
    alt: "درگاه پرداخت مستقیم سپ بانک سامان",
    label: "درگاه مستقیم\nبانک سامان",
    title: "درگاه پرداخت مستقیم سپ بانک سامان",
    description: [
      "پرداخت‌های آنلاین فروشگاه سبزفراز از طریق درگاه پرداخت مستقیم «سپ» بانک سامان (SEP) انجام می‌شود.",
      "این درگاه یکی از معتبرترین و امن‌ترین درگاه‌های پرداخت بانکی کشور است که مستقیماً زیر نظر بانک مرکزی جمهوری اسلامی ایران فعالیت می‌کند.",
      "اطلاعات کارت بانکی شما هیچ‌گاه در سرورهای فروشگاه ذخیره نمی‌شود و تمام مراحل پرداخت با بالاترین استانداردهای امنیتی داخل درگاه بانک سامان انجام می‌گیرد.",
    ],
  },
  {
    key: "shaparak",
    img: "/badges/shaprk.jpg",
    alt: "شرکت شبکه الکترونیکی پرداخت کارت (شاپرک)",
    label: "پرداخت امن\nشاپرک",
    title: "شرکت شبکه الکترونیکی پرداخت کارت (شاپرک)",
    description: [
      "کلیه‌ی تراکنش‌های بانکی سبزفراز تحت نظارت مستقیم «شاپرک» (شرکت شبکه الکترونیکی پرداخت کارت) پردازش می‌شود.",
      "شاپرک زیرمجموعه‌ی بانک مرکزی و ناظر رسمی و قانونی تمام پرداخت‌های کارت‌به‌کارت و اینترنتی کشور است و از سلامت و امنیت هر تراکنش اطمینان می‌دهد.",
      "با اتکا به این زیرساخت، خرید شما در سبزفراز کاملاً امن، شفاف و قابل استعلام است.",
    ],
  },
];

export default function PaymentGatewayBadges() {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const active = BADGES.find((b) => b.key === openKey);

  return (
    <>
      <div className="payment-badges-row">
        {BADGES.map((b) => (
          <button
            key={b.key}
            type="button"
            className="enamad-badge-item"
            onClick={() => setOpenKey(b.key)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <span className="enamad-badge-media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.img} alt={b.alt} />
            </span>
            <span className="enamad-badge-label">{b.label}</span>
          </button>
        ))}
      </div>

      {active && (
        <div className="gateway-badge-modal-overlay" onClick={() => setOpenKey(null)}>
          <div className="gateway-badge-modal" onClick={(e) => e.stopPropagation()}>
            <button className="gateway-badge-modal-close" onClick={() => setOpenKey(null)} aria-label="بستن">×</button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={active.img} alt={active.alt} className="gateway-badge-modal-img" />
            <h3>{active.title}</h3>
            {active.description.map((line, i) => <p key={i}>{line}</p>)}
          </div>
        </div>
      )}
    </>
  );
}