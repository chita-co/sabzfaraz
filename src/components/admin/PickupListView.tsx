"use client";
import { Printer } from "lucide-react";

interface Row { id: string; product_name: string; quantity: number; selected_color: string | null; selected_size: string | null; order: { order_number: string } | null; }
interface Group { partnerName: string; partnerCode: string | null; rows: Row[]; }
interface PartnerOption { id: string; business_name: string; partner_code: string | null; }

export default function PickupListView({ groups, partners, dateLabel }: { groups: Group[]; partners: PartnerOption[]; dateLabel: string }) {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 24, direction: "rtl", fontFamily: "Tahoma, sans-serif" }}>
      <form method="GET" className="no-print" style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <input type="date" name="from" className="admin-input" />
        <input type="date" name="to" className="admin-input" />
        <select name="partnerId" className="admin-input">
          <option value="">همه همکاران</option>
          {partners.map((p) => <option key={p.id} value={p.id}>{p.business_name}</option>)}
        </select>
        <button type="submit" className="admin-btn admin-btn-secondary">اعمال فیلتر</button>
        <button type="button" onClick={() => window.print()} className="admin-btn admin-btn-primary" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Printer size={15} /> چاپ برگه تحویل پیک
        </button>
      </form>

      <h1 style={{ fontSize: 16, fontWeight: 800, textAlign: "center", borderBottom: "2px dashed #111827", paddingBottom: 10, marginBottom: 16 }}>
        برگه تحویل پیک — تاریخ: {dateLabel}
      </h1>

      {groups.length === 0 && <p style={{ textAlign: "center", color: "#9ca3af" }}>سفارش آماده تحویلی یافت نشد.</p>}

      {groups.map((g, gi) => (
        <div key={gi} style={{ marginBottom: 26, pageBreakInside: "avoid" }}>
          <h2 style={{ fontSize: 13.5, fontWeight: 800, background: "#f3f4f6", padding: "6px 10px", borderRadius: 6 }}>
            همکار: {g.partnerName} {g.partnerCode ? `(کد: ${g.partnerCode})` : ""}
          </h2>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginTop: 8 }}>
            <thead>
              <tr style={{ background: "#111827", color: "#fff" }}>
                <th style={{ padding: 6, border: "1px solid #111827" }}>ردیف</th>
                <th style={{ padding: 6, border: "1px solid #111827" }}>کد سفارش</th>
                <th style={{ padding: 6, border: "1px solid #111827" }}>محصول</th>
                <th style={{ padding: 6, border: "1px solid #111827" }}>تعداد</th>
                <th style={{ padding: 6, border: "1px solid #111827" }}>توضیحات</th>
              </tr>
            </thead>
            <tbody>
              {g.rows.map((r, ri) => (
                <tr key={r.id}>
                  <td style={{ padding: 6, border: "1px solid #d1d5db", textAlign: "center" }}>{(ri + 1).toLocaleString("fa-IR")}</td>
                  <td style={{ padding: 6, border: "1px solid #d1d5db", textAlign: "center" }} dir="ltr">{r.order?.order_number}</td>
                  <td style={{ padding: 6, border: "1px solid #d1d5db" }}>{r.product_name}</td>
                  <td style={{ padding: 6, border: "1px solid #d1d5db", textAlign: "center" }}>{r.quantity.toLocaleString("fa-IR")}</td>
                  <td style={{ padding: 6, border: "1px solid #d1d5db" }}>{[r.selected_color, r.selected_size].filter(Boolean).join(" / ") || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ✅ بخش جدید: شرح شفاف هر قلم */}
<div style={{ marginTop: 8, fontSize: 12, background: "#f9fafb", padding: "8px 10px", borderRadius: 6 }}>
  {g.rows.map((r) => (
    <p key={r.id} style={{ margin: "3px 0" }}>
      تعداد <strong>{r.quantity.toLocaleString("fa-IR")}</strong> از{" "}
      <strong>{r.product_name}</strong> توسط{" "}
      <strong>{g.partnerName}</strong> برای فاکتور شماره{" "}
      <strong dir="ltr">{r.order?.order_number}</strong>
    </p>
  ))}
</div>

          <p style={{ fontSize: 11.5, fontWeight: 700, marginTop: 6 }}>جمع کل اقلام: {g.rows.reduce((s, r) => s + r.quantity, 0).toLocaleString("fa-IR")} عدد</p>
        </div>
      ))}

      {groups.length > 0 && (
        <div style={{ marginTop: 30, display: "flex", justifyContent: "space-between", fontSize: 12.5, borderTop: "2px dashed #111827", paddingTop: 14 }}>
          <span>امضای پیک: ______________</span>
          <span>تاریخ تحویل: ______________</span>
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