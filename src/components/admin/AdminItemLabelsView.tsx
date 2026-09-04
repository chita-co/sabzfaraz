"use client";
import { Printer } from "lucide-react";
import "../../app/admin/item-labels.css";

interface LabelItem {
  name: string;
  quantity: number;
  variant?: string | null;
  partnerName?: string | null;
  orderNumber?: string | null;
}

export default function AdminItemLabelsView({
  orderNumber,
  storeName,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  storeAddress,
  items,
}: {
  orderNumber: string;
  storeName: string;
  storeAddress: string;
  items: LabelItem[];
}) {
  // هر خط سفارش (هر ترکیب محصول+رنگ+سایز) فقط یک اتیکت می‌گیرد،
  // با عدد تعداد رویش — نه یک اتیکت جدا برای هر واحد کالا
  const labels = items;

  return (
    <div className="item-labels-page">
      <div className="no-print flex gap-2 mb-4">
        <button
          onClick={() => window.print()}
          className="admin-btn admin-btn-primary flex items-center gap-2"
        >
          <Printer size={16} /> چاپ اتیکت‌ها ({labels.length.toLocaleString("fa-IR")} برچسب)
        </button>
      </div>
      <div className="item-labels-grid">
        {labels.map((item, i) => (
          <div key={i} className="item-label-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-invoice.png"
              alt={storeName}
              className="item-label-logo"
            />
            <div className="item-label-body">
              <p className="item-label-store">{storeName}</p>
              {item.partnerName && (
                <p className="item-label-partner">
                  همکار: <strong>{item.partnerName}</strong>
                </p>
              )}
              <p className="item-label-product">
                {item.name}
                {item.variant ? ` — ${item.variant}` : ""}
              </p>
              <p className="item-label-qty">
                {item.quantity.toLocaleString("fa-IR")} عدد
              </p>
              <p className="item-label-order" dir="ltr">
                {item.orderNumber ?? orderNumber}
              </p>
            </div>
            <p className="item-label-site" dir="ltr">
              sabzfaraz.ir
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}