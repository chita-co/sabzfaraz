"use client";

import { useState, useRef, useEffect } from "react";
import { Printer, Download } from "lucide-react";
import "../../app/admin/shipping-label.css";
import { renderLabelToPdf } from "@/lib/generateLabelPdf";

interface PartyInfo {
  name: string;
  phone: string;
  postalCode: string;
  address: string;
}
interface ContentItem { name: string; qty: number; value: number; }

export default function ShippingLabelForm({
  orderNumber,
  date,
  sender,
  receiver,
  items,
}: {
  orderNumber: string;
  date: string;
  sender: PartyInfo;
  receiver: PartyInfo;
  items: ContentItem[];
}) {
  const [shipmentType, setShipmentType] = useState<"normal" | "express" | "custom">("normal");
  const [weight, setWeight] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [declaredValue, setDeclaredValue] = useState("");
  const [fragile, setFragile] = useState(false);
  const [doorDelivery, setDoorDelivery] = useState(true);
  const [generating, setGenerating] = useState(false);

  const labelRef = useRef<HTMLDivElement>(null);
  const barcodeRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let mounted = true;
    import("jsbarcode").then((mod) => {
      if (!mounted || !barcodeRef.current) return;
      const JsBarcode = mod.default;
      JsBarcode(barcodeRef.current, orderNumber, {
        format: "CODE128",
        displayValue: false,
        height: 34,
        margin: 0,
      });
    });
    return () => { mounted = false; };
  }, [orderNumber]);

  const typeLabels: Record<string, string> = { normal: "عادی", express: "پیشتاز", custom: "سفارشی" };

  async function handleDownloadPdf() {
    if (!labelRef.current) return;
    setGenerating(true);
    try {
      await renderLabelToPdf(labelRef.current, `shipping-label-${orderNumber}.pdf`);
    } catch (e) {
      console.error(e);
      alert("خطا در ساخت PDF.");
    }
    setGenerating(false);
  }

  return (
    <div className="shipping-label-page">
      <div className="shipping-label-form no-print">
        <div className="admin-card">
          <h2 className="font-bold text-gray-800 mb-4">اطلاعات مرسوله</h2>

          <div className="admin-form-group">
            <label>نوع مرسوله</label>
            <select value={shipmentType} onChange={(e) => setShipmentType(e.target.value as "normal" | "express" | "custom")}>
              <option value="normal">عادی</option>
              <option value="express">پیشتاز</option>
              <option value="custom">سفارشی</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="admin-form-group">
              <label>وزن (کیلوگرم)</label>
              <input type="number" step="0.01" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="مثلاً: 1.2" />
            </div>
            <div className="admin-form-group">
              <label>ارزش محموله (تومان — اختیاری)</label>
              <input type="number" value={declaredValue} onChange={(e) => setDeclaredValue(e.target.value)} placeholder="اختیاری" />
            </div>
          </div>

          <div className="admin-form-group">
            <label>ابعاد (سانتی‌متر) طول × عرض × ارتفاع</label>
            <div className="grid grid-cols-3 gap-2">
              <input type="number" value={length} onChange={(e) => setLength(e.target.value)} placeholder="طول" />
              <input type="number" value={width} onChange={(e) => setWidth(e.target.value)} placeholder="عرض" />
              <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="ارتفاع" />
            </div>
          </div>

          <div className="admin-form-group flex items-center gap-2">
            <input type="checkbox" id="fragile" checked={fragile} onChange={(e) => setFragile(e.target.checked)} />
            <label htmlFor="fragile" style={{ marginBottom: 0 }}>شکننده</label>
          </div>
          <div className="admin-form-group flex items-center gap-2">
            <input type="checkbox" id="doorDelivery" checked={doorDelivery} onChange={(e) => setDoorDelivery(e.target.checked)} />
            <label htmlFor="doorDelivery" style={{ marginBottom: 0 }}>تحویل درب مقصد</label>
          </div>

          <div className="flex gap-2 mt-4">
            <button onClick={() => window.print()} className="admin-btn admin-btn-primary flex items-center gap-2">
              <Printer size={16} /> چاپ مستقیم
            </button>
            <button onClick={handleDownloadPdf} disabled={generating} className="admin-btn admin-btn-secondary flex items-center gap-2">
              <Download size={16} /> {generating ? "در حال ساخت..." : "دانلود PDF"}
            </button>
          </div>
        </div>
      </div>

      <div className="shipping-label-preview-wrap">
        <div className="shipping-label shipping-label-print" ref={labelRef}>
          <div className="shipping-label-header">
            <span className="shipping-label-title">برچسب مرسوله</span>
            <span className="shipping-label-type-badge">{typeLabels[shipmentType]}</span>
          </div>

          <div className="shipping-label-barcode">
            <canvas ref={barcodeRef} />
            <p className="shipping-label-tracking-text" dir="ltr">{orderNumber}</p>
          </div>

          <div className="shipping-label-parties">
            <div className="shipping-label-party">
              <p className="shipping-label-party-title">فرستنده</p>
              <p>{sender.name}</p>
              <p dir="ltr">{sender.phone}</p>
              <p>کدپستی: <span dir="ltr">{sender.postalCode || "—"}</span></p>
              <p>{sender.address}</p>
            </div>
            <div className="shipping-label-party">
              <p className="shipping-label-party-title">گیرنده</p>
              <p>{receiver.name}</p>
              <p dir="ltr">{receiver.phone}</p>
              <p>کدپستی: <span dir="ltr">{receiver.postalCode || "—"}</span></p>
              <p>{receiver.address}</p>
            </div>
          </div>

          <div className="shipping-label-meta">
            <div className="shipping-label-meta-item"><b>وزن:</b><span>{weight ? `${weight} کیلوگرم` : "—"}</span></div>
            <div className="shipping-label-meta-item"><b>ابعاد:</b><span>{length && width && height ? `${length}×${width}×${height} سانتی‌متر` : "—"}</span></div>
            <div className="shipping-label-meta-item"><b>ارزش محموله:</b><span>{declaredValue ? `${Number(declaredValue).toLocaleString("fa-IR")} تومان` : "اظهار نشده"}</span></div>
            <div className="shipping-label-meta-item"><b>تاریخ:</b><span>{date}</span></div>
          </div>

          <div className="shipping-label-services">
            <div className="shipping-label-service">
              <span className={`shipping-label-checkbox${fragile ? " checked" : ""}`} />
              شکننده
            </div>
            <div className="shipping-label-service">
              <span className={`shipping-label-checkbox${doorDelivery ? " checked" : ""}`} />
              تحویل درب مقصد
            </div>
          </div>

          <table className="shipping-label-content-table">
            <thead><tr><th>شرح کالا</th><th>تعداد</th><th>ارزش (تومان)</th></tr></thead>
            <tbody>
              {items.slice(0, 5).map((it, i) => (
                <tr key={i}>
                  <td>{it.name}</td>
                  <td>{it.qty.toLocaleString("fa-IR")}</td>
                  <td>{it.value.toLocaleString("fa-IR")}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="shipping-label-footer">شماره سفارش: <span dir="ltr">{orderNumber}</span> — این برچسب صرفاً جهت استفاده داخلی فروشگاه است.</p>
        </div>
      </div>
    </div>
  );
}