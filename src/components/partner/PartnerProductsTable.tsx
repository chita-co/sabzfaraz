"use client";
import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import { Check, X as XIcon } from "lucide-react";
import PartnerProductDeleteButton from "@/components/partner/PartnerProductDeleteButton";
import { updatePartnerProductQuickFieldsAction } from "@/app/partner/products/actions";

const statusLabel: Record<string, string> = {
  PENDING_REVIEW: "در انتظار بررسی", APPROVED: "منتشرشده", REJECTED: "رد شده", SUSPENDED: "تعلیق‌شده",
};

interface ProductRow {
  id: string;
  name: string;
  price: number;
  partner_cost_price: number | null;
  stock: number;
  partner_stock_unlimited: boolean;
  partner_approval_status: string;
  partner_rejection_reason: string | null;
  is_active: boolean;
  created_at: string;
  images: string[];
}

function normalize(str: string): string {
  const persian = "۰۱۲۳۴۵۶۷۸۹";
  const arabic = "٠١٢٣٤٥٦٧٨٩";
  return str
    .toLowerCase()
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[۰-۹٠-٩]/g, (d) => {
      const p = persian.indexOf(d);
      if (p > -1) return String(p);
      const a = arabic.indexOf(d);
      if (a > -1) return String(a);
      return d;
    })
    .replace(/[\u064B-\u065F\u200c]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function matchesQuery(name: string, query: string): boolean {
  const n = normalize(name);
  const q = normalize(query);
  if (!q) return true;
  if (n.includes(q)) return true;
  const words = q.split(" ").filter(Boolean);
  return words.length > 0 && words.every((w) => n.includes(w));
}

export default function PartnerProductsTable({ products }: { products: ProductRow[] }) {
  const [search, setSearch] = useState("");
  const [hideImages, setHideImages] = useState(false);
  const showImages = !hideImages;
  const [rows, setRows] = useState(products);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editCost, setEditCost] = useState("");
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [editStock, setEditStock] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(
    () => rows.filter((p) => matchesQuery(p.name, search)),
    [rows, search]
  );

  function openPriceEditor(p: ProductRow) {
    setEditingStockId(null);
    setEditingId(p.id);
    setEditPrice(String(p.price));
    setEditCost(String(p.partner_cost_price ?? 0));
  }

  function applySellPercent(percent: number) {
    const sell = Number(editPrice);
    if (!sell || sell <= 0) return toast.error("ابتدا قیمت فروش را وارد کنید.");
    setEditCost(String(Math.round((sell * (1 - percent / 100)) / 1000) * 1000));
  }
  function applyReceivedPercent(percent: number) {
    const received = Number(editCost);
    if (!received || received <= 0) return toast.error("ابتدا قیمت دریافتی را وارد کنید.");
    setEditPrice(String(Math.round((received / (1 - percent / 100)) / 1000) * 1000));
  }

  const editSell = Number(editPrice) || 0;
  const editReceived = Number(editCost) || 0;
  const editProfit = editSell - editReceived;
  const editProfitPercent = editSell > 0 ? (editProfit / editSell) * 100 : 0;

  function savePrice(id: string) {
    const price = Number(editPrice);
    const cost = Number(editCost);
    if (!price || price <= 0 || !cost || cost <= 0) return toast.error("قیمت‌ها معتبر نیست.");
    startTransition(async () => {
      const res = await updatePartnerProductQuickFieldsAction({ productId: id, price, partnerCostPrice: cost });
      if (res?.error) { toast.error(res.error); return; }
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, price, partner_cost_price: cost } : r)));
      setEditingId(null);
      toast.success("قیمت با موفقیت ذخیره شد.");
    });
  }

  function saveStock(id: string) {
    const stock = Number(editStock);
    if (isNaN(stock) || stock < 0) return toast.error("موجودی معتبر نیست.");
    startTransition(async () => {
      const res = await updatePartnerProductQuickFieldsAction({ productId: id, stock });
      if (res?.error) { toast.error(res.error); return; }
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, stock } : r)));
      setEditingStockId(null);
      toast.success("موجودی با موفقیت ذخیره شد.");
    });
  }

  return (
    <div className="partner-card">
      <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
        <input
          className="partner-input"
          type="text"
          placeholder="جستجوی نام محصول (فارسی یا انگلیسی)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 320 }}
        />
        <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12.5, cursor: "pointer", userSelect: "none" }}>
          <input type="checkbox" checked={hideImages} onChange={(e) => setHideImages(e.target.checked)} />
          عدم نمایش تصویر محصولات
        </label>
        {search && (
          <span style={{ fontSize: 12, color: "#6b7280" }}>
            {filtered.length.toLocaleString("fa-IR")} نتیجه از {rows.length.toLocaleString("fa-IR")} محصول
          </span>
        )}
      </div>
      <p style={{ fontSize: 11.5, color: "#9ca3af", marginBottom: 8 }}>
        برای ویرایش سریع، روی «قیمت فروش»، «قیمت دریافتی» یا «موجودی» دابل‌کلیک کنید.
      </p>
      <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "right", color: "#6b7280", borderBottom: "2px solid #f3f4f6" }}>
            {showImages && <th style={{ padding: 8 }}>تصویر</th>}
            <th style={{ padding: 8 }}>نام</th>
            <th style={{ padding: 8 }}>قیمت فروش</th>
            <th style={{ padding: 8 }}>قیمت دریافتی</th>
            <th style={{ padding: 8 }}>موجودی</th>
            <th style={{ padding: 8 }}>وضعیت</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((p) => (
            <>
              <tr key={p.id} style={{ borderBottom: editingId === p.id ? "none" : "1px solid #f3f4f6" }}>
                {showImages && (
                  <td style={{ padding: 8 }}>
                    {p.images?.[0] ? (
                      <Image
                        src={p.images[0]}
                        alt={p.name}
                        width={340}
                        height={74}
                        unoptimized
                        style={{ width: 340, height: 74, objectFit: "cover", borderRadius: 10 }}
                      />
                    ) : (
                      <div style={{ width: 340, height: 74, background: "#f3f4f6", borderRadius: 10 }} />
                    )}
                  </td>
                )}
                <td style={{ padding: 8 }}>{p.name}</td>
                <td style={{ padding: 8, cursor: "pointer" }} onDoubleClick={() => openPriceEditor(p)} title="دابل‌کلیک برای ویرایش">
                  {p.price.toLocaleString("fa-IR")} تومان
                </td>
                <td style={{ padding: 8, cursor: "pointer" }} onDoubleClick={() => openPriceEditor(p)} title="دابل‌کلیک برای ویرایش">
                  {(p.partner_cost_price ?? 0).toLocaleString("fa-IR")} تومان
                </td>
                <td style={{ padding: 8, cursor: p.partner_stock_unlimited ? "default" : "pointer" }}
                    onDoubleClick={() => { if (!p.partner_stock_unlimited) { setEditingId(null); setEditingStockId(p.id); setEditStock(String(p.stock)); } }}
                    title={p.partner_stock_unlimited ? "" : "دابل‌کلیک برای ویرایش"}>
                  {editingStockId === p.id ? (
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <input
                        className="partner-input"
                        type="number"
                        value={editStock}
                        onChange={(e) => setEditStock(e.target.value)}
                        style={{ width: 80, padding: "2px 6px" }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button type="button" disabled={isPending} onClick={(e) => { e.stopPropagation(); saveStock(p.id); }} style={{ color: "#16a34a", background: "none", border: "none", cursor: "pointer" }}><Check size={16} /></button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); setEditingStockId(null); }} style={{ color: "#dc2626", background: "none", border: "none", cursor: "pointer" }}><XIcon size={16} /></button>
                    </span>
                  ) : (
                    p.partner_stock_unlimited ? "نامحدود" : p.stock.toLocaleString("fa-IR")
                  )}
                </td>
                <td style={{ padding: 8 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: p.partner_approval_status === "APPROVED" ? "#16a34a" : p.partner_approval_status === "REJECTED" ? "#dc2626" : "#b45309" }}>
                    {statusLabel[p.partner_approval_status] ?? p.partner_approval_status}
                  </span>
                  {p.partner_rejection_reason && <p style={{ fontSize: 10.5, color: "#dc2626" }}>{p.partner_rejection_reason}</p>}
                </td>
                <td style={{ padding: 8, display: "flex", gap: 6 }}>
                  <Link href={`/partner/products/${p.id}/edit`} className="partner-btn partner-btn-secondary" style={{ padding: "4px 12px", fontSize: 12 }}>ویرایش</Link>
                  <PartnerProductDeleteButton productId={p.id} />
                </td>
              </tr>
              {editingId === p.id && (
                <tr style={{ borderBottom: "1px solid #f3f4f6", background: "#f9fafb" }}>
                  <td colSpan={showImages ? 7 : 6} style={{ padding: 12 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-start" }}>
                      <div>
                        <label style={{ fontSize: 11.5, color: "#6b7280" }}>قیمت فروش به مشتری</label>
                        <input className="partner-input" type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} style={{ width: 140, display: "block" }} />
                        <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                          {[11, 13, 15].map((pc) => (
                            <button key={pc} type="button" onClick={() => applySellPercent(pc)} style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid #16a34a", background: "#f0fdf4", color: "#166534", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>{pc}٪</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: 11.5, color: "#6b7280" }}>قیمتی که دریافت می‌کنید</label>
                        <input className="partner-input" type="number" value={editCost} onChange={(e) => setEditCost(e.target.value)} style={{ width: 140, display: "block" }} />
                        <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                          {[11, 13, 15].map((pc) => (
                            <button key={pc} type="button" onClick={() => applyReceivedPercent(pc)} style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid #16a34a", background: "#f0fdf4", color: "#166534", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>{pc}٪</button>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, justifyContent: "center" }}>
                        <p style={{ fontSize: 11.5, color: editProfitPercent >= 0 ? "#16a34a" : "#dc2626" }}>
                          سود سایت: {editProfit.toLocaleString("fa-IR")} تومان ({editProfitPercent.toFixed(1)}٪)
                        </p>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button type="button" disabled={isPending} onClick={() => savePrice(p.id)} className="partner-btn partner-btn-primary" style={{ padding: "6px 16px", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}><Check size={14} /> اعمال</button>
                          <button type="button" onClick={() => setEditingId(null)} className="partner-btn partner-btn-secondary" style={{ padding: "6px 16px", fontSize: 12 }}>انصراف</button>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
      {filtered.length === 0 && (
        <p style={{ color: "#9ca3af", fontSize: 13, textAlign: "center", padding: 20 }}>
          {rows.length === 0 ? "هنوز محصولی ثبت نکرده‌اید." : "محصولی با این نام پیدا نشد."}
        </p>
      )}
    </div>
  );
}