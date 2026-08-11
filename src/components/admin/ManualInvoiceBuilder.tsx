"use client";

import { useState, useMemo } from "react";
import { Plus, Trash2, Save, Printer, Download } from "lucide-react";
import { buildInvoiceHtml } from "@/lib/buildInvoiceHtml";
import { renderInvoiceToPdf } from "@/lib/generateInvoicePdf";
import { imageUrlToDataUri } from "@/lib/invoiceImage";
import { saveManualInvoice } from "@/app/admin/bulk-orders/invoice-actions";

interface Row { id: string; name: string; qty: number; unitPrice: number; }

export default function ManualInvoiceBuilder({
  requestId,
  requestNumber,
  buyerName,
  buyerPhone,
  buyerAddress,
  storeName,
  storePhones,
  storeAddress,
  logoUrl,
  initialNumber,
}: {
  requestId: string;
  requestNumber: string;
  buyerName: string;
  buyerPhone: string;
  buyerAddress: string;
  storeName: string;
  storePhones: string[];
  storeAddress: string;
  logoUrl: string | null;
  initialHtml: string | null;
  initialNumber: string | null;
}) {
  const [rows, setRows] = useState<Row[]>([
    { id: crypto.randomUUID(), name: "", qty: 1, unitPrice: 0 },
  ]);
  const [discountPercent, setDiscountPercent] = useState("0");
  const [note, setNote] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState(
    initialNumber ?? `INV-${requestNumber}`
  );
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  function addRow() {
    setRows((p) => [
      ...p,
      { id: crypto.randomUUID(), name: "", qty: 1, unitPrice: 0 },
    ]);
  }
  function removeRow(id: string) {
    setRows((p) => (p.length > 1 ? p.filter((r) => r.id !== id) : p));
  }
  function updateRow(id: string, field: keyof Row, value: string | number) {
    setRows((p) =>
      p.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  }

  const subtotal = rows.reduce((s, r) => s + r.qty * r.unitPrice, 0);
  const discountAmount = Math.round(
    (subtotal * (Number(discountPercent) || 0)) / 100
  );

  const previewHtml = useMemo(
    () =>
      buildInvoiceHtml({
        type: "final",
        invoiceNumber,
        date: new Date().toLocaleDateString("fa-IR"),
        storeName,
        storePhones,
        storeAddress,
        logoDataUri: null,
        buyerName,
        buyerPhone,
        buyerAddress,
        items: rows
          .filter((r) => r.name.trim())
          .map((r) => ({
            name: r.name,
            quantity: r.qty,
            unitPrice: r.unitPrice,
          })),
        subtotal,
        shippingCost: 0,
        discountAmount,
        note,
      }),
    [
      rows,
      note,
      invoiceNumber,
      buyerName,
      buyerPhone,
      buyerAddress,
      storeName,
      storePhones,
      storeAddress,
      subtotal,
      discountAmount,
    ]
  );

  async function handleSave() {
    setSaving(true);
    await saveManualInvoice(requestId, previewHtml, invoiceNumber);
    setSaving(false);
    alert("فاکتور ذخیره شد.");
  }

  async function handleDownload() {
    setGenerating(true);
    const logoDataUri = logoUrl ? await imageUrlToDataUri(logoUrl) : null;
    const html = buildInvoiceHtml({
      type: "final",
      invoiceNumber,
      date: new Date().toLocaleDateString("fa-IR"),
      storeName,
      storePhones,
      storeAddress,
      logoDataUri,
      buyerName,
      buyerPhone,
      buyerAddress,
      items: rows
        .filter((r) => r.name.trim())
        .map((r) => ({
          name: r.name,
          quantity: r.qty,
          unitPrice: r.unitPrice,
        })),
      subtotal,
      shippingCost: 0,
      discountAmount,
      note,
    });
    await renderInvoiceToPdf(html, `${invoiceNumber}.pdf`);
    setGenerating(false);
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-5">
        ساخت فاکتور دستی — سفارش جمعی {requestNumber}
      </h1>

      <div className="admin-card mb-5">
        <div className="admin-form-group">
          <label>شماره فاکتور</label>
          <input
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
          />
        </div>

        <h2 className="font-bold text-gray-800 mb-3 mt-4">اقلام فاکتور</h2>
        {rows.map((r) => (
          <div
            key={r.id}
            className="grid grid-cols-12 gap-2 items-center mb-2"
          >
            <input
              placeholder="نام کالا/خدمات"
              value={r.name}
              onChange={(e) => updateRow(r.id, "name", e.target.value)}
              className="col-span-5 admin-input"
            />
            <input
              type="number"
              placeholder="تعداد"
              value={r.qty}
              onChange={(e) => updateRow(r.id, "qty", Number(e.target.value))}
              className="col-span-2 admin-input"
            />
            <input
              type="number"
              placeholder="قیمت واحد"
              value={r.unitPrice}
              onChange={(e) =>
                updateRow(r.id, "unitPrice", Number(e.target.value))
              }
              className="col-span-3 admin-input"
            />
            <span className="col-span-1 text-xs text-gray-500">
              {(r.qty * r.unitPrice).toLocaleString("fa-IR")}
            </span>
            <button
              onClick={() => removeRow(r.id)}
              className="col-span-1 admin-btn admin-btn-danger"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
        <button
          onClick={addRow}
          className="admin-btn admin-btn-secondary flex items-center gap-1 mt-2"
        >
          <Plus size={14} /> افزودن ردیف
        </button>

        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          <div className="admin-form-group">
            <label>درصد تخفیف</label>
            <input
              type="number"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
            />
          </div>
          <div className="admin-form-group">
            <label>توضیحات فاکتور (اختیاری)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>

        <p className="text-sm font-bold text-gray-800 mt-3">
          جمع نهایی: {(subtotal - discountAmount).toLocaleString("fa-IR")} تومان
        </p>

        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="admin-btn admin-btn-primary flex items-center gap-2"
          >
            <Save size={14} /> ذخیره فاکتور
          </button>
          <button
            onClick={handleDownload}
            disabled={generating}
            className="admin-btn admin-btn-secondary flex items-center gap-2"
          >
            <Download size={14} /> دانلود PDF
          </button>
          <button
            onClick={() => window.print()}
            className="admin-btn admin-btn-secondary flex items-center gap-2"
          >
            <Printer size={14} /> چاپ
          </button>
        </div>
      </div>

      <div className="admin-card">
        <h2 className="font-bold text-gray-800 mb-3">پیش‌نمایش</h2>
        <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
      </div>
    </div>
  );
}