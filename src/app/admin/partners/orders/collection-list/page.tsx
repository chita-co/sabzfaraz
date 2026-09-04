"use client";
import { useEffect, useState } from "react";
import { Printer, Trash2, X } from "lucide-react";
import { getCollectionListIds, removeFromCollectionList, clearCollectionList } from "@/lib/partners/collectionListStorage";
import { getCollectionListItemsAction } from "@/app/admin/partners/orders/actions";

interface ItemRow {
  id: string; product_name: string; quantity: number; selected_color: string | null; selected_size: string | null;
  partner_fulfillment_status: string;
  partner: { business_name: string; partner_code: string | null } | null;
  order: { order_number: string } | null;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "در انتظار آماده‌سازی", PREPARING: "در حال آماده‌سازی", READY_FOR_PICKUP: "تحویل سفارش به پیک فروشگاه",
  PICKED_UP: "تحویل گرفته شد از همکار", DELIVERED_TO_CUSTOMER: "تحویل به مشتری شد",
  STOCK_SHORTAGE: "عدم تامین", RETURNED_BY_CUSTOMER: "برگشت از مشتری", CANCELLED: "لغو‌شده",
};

export default function CollectionListPage() {
  const [items, setItems] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const ids = getCollectionListIds();
    if (ids.length === 0) { setItems([]); setLoading(false); return; }
    setLoading(true);
    const data = await getCollectionListItemsAction(ids);
    setItems(data as ItemRow[]);
    setLoading(false);
  }

  useEffect(() => {
    const timer = setTimeout(() => { load(); }, 0);
    return () => clearTimeout(timer);
  }, []);

  function handleRemove(id: string) {
    removeFromCollectionList(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }
  function handleClear() {
    if (!confirm("همه‌ی موارد از لیست جمع‌آوری پاک شوند؟")) return;
    clearCollectionList();
    setItems([]);
  }

  const grouped = new Map<string, { partnerName: string; partnerCode: string | null; rows: ItemRow[] }>();
  items.forEach((it) => {
    const key = it.partner?.business_name ?? "نامشخص";
    if (!grouped.has(key)) grouped.set(key, { partnerName: it.partner?.business_name ?? "نامشخص", partnerCode: it.partner?.partner_code ?? null, rows: [] });
    grouped.get(key)!.rows.push(it);
  });

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 24, direction: "rtl", fontFamily: "Tahoma, sans-serif" }}>
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 8 }}>
        <h1 style={{ fontSize: 16, fontWeight: 800 }}>لیست جمع‌آوری دستی (اقلامی که هنوز آماده اعلام نشده‌اند)</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleClear} className="admin-btn admin-btn-danger" style={{ display: "flex", alignItems: "center", gap: 4 }}><Trash2 size={14} /> خالی‌کردن لیست</button>
          <button onClick={() => window.print()} className="admin-btn admin-btn-primary" style={{ display: "flex", alignItems: "center", gap: 4 }}><Printer size={14} /> چاپ لیست</button>
        </div>
      </div>

      {loading && <p style={{ textAlign: "center", color: "#9ca3af" }}>در حال بارگذاری...</p>}
      {!loading && items.length === 0 && <p style={{ textAlign: "center", color: "#9ca3af" }}>لیست خالی است. از صفحه‌ی «مدیریت سفارش‌های همکاران»، آیتم‌ها را تیک بزنید و به این لیست اضافه کنید.</p>}

      {Array.from(grouped.values()).map((g, gi) => (
        <div key={gi} style={{ marginBottom: 24, pageBreakInside: "avoid" }}>
          <h2 style={{ fontSize: 13.5, fontWeight: 800, background: "#f3f4f6", padding: "6px 10px", borderRadius: 6 }}>
            همکار: {g.partnerName} {g.partnerCode ? `(کد: ${g.partnerCode})` : ""}
          </h2>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginTop: 8 }}>
            <thead>
              <tr style={{ background: "#111827", color: "#fff" }}>
                <th style={{ padding: 6, border: "1px solid #111827" }}>کد سفارش</th>
                <th style={{ padding: 6, border: "1px solid #111827" }}>محصول</th>
                <th style={{ padding: 6, border: "1px solid #111827" }}>تعداد</th>
                <th style={{ padding: 6, border: "1px solid #111827" }}>وضعیت فعلی</th>
                <th className="no-print" style={{ padding: 6, border: "1px solid #111827" }}></th>
              </tr>
            </thead>
            <tbody>
              {g.rows.map((r) => (
                <tr key={r.id}>
                  <td style={{ padding: 6, border: "1px solid #d1d5db", textAlign: "center" }} dir="ltr">{r.order?.order_number}</td>
                  <td style={{ padding: 6, border: "1px solid #d1d5db" }}>{r.product_name}{[r.selected_color, r.selected_size].filter(Boolean).length > 0 ? ` (${[r.selected_color, r.selected_size].filter(Boolean).join(" / ")})` : ""}</td>
                  <td style={{ padding: 6, border: "1px solid #d1d5db", textAlign: "center" }}>{r.quantity.toLocaleString("fa-IR")}</td>
                  <td style={{ padding: 6, border: "1px solid #d1d5db", textAlign: "center" }}>{STATUS_LABELS[r.partner_fulfillment_status] ?? r.partner_fulfillment_status}</td>
                  <td className="no-print" style={{ padding: 6, border: "1px solid #d1d5db", textAlign: "center" }}>
                    <button onClick={() => handleRemove(r.id)}><X size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {items.length > 0 && (
        <div style={{ marginTop: 30, display: "flex", justifyContent: "space-between", fontSize: 12.5, borderTop: "2px dashed #111827", paddingTop: 14 }}>
          <span>امضای تحویل‌گیرنده: ______________</span>
          <span>تاریخ: ______________</span>
        </div>
      )}

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          @page { size: A4; margin: 12mm; }
        }
      `}</style>
    </div>
  );
}