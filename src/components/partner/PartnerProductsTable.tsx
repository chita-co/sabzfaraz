"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import PartnerProductDeleteButton from "@/components/partner/PartnerProductDeleteButton";

const statusLabel: Record<string, string> = {
  PENDING_REVIEW: "در انتظار بررسی", APPROVED: "منتشرشده", REJECTED: "رد شده", SUSPENDED: "تعلیق‌شده",
};

interface ProductRow {
  id: string;
  name: string;
  price: number;
  stock: number;
  partner_stock_unlimited: boolean;
  partner_approval_status: string;
  partner_rejection_reason: string | null;
  is_active: boolean;
  created_at: string;
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

  const filtered = useMemo(
    () => products.filter((p) => matchesQuery(p.name, search)),
    [products, search]
  );

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
        {search && (
          <span style={{ fontSize: 12, color: "#6b7280" }}>
            {filtered.length.toLocaleString("fa-IR")} نتیجه از {products.length.toLocaleString("fa-IR")} محصول
          </span>
        )}
      </div>
      <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "right", color: "#6b7280", borderBottom: "2px solid #f3f4f6" }}>
            <th style={{ padding: 8 }}>نام</th><th style={{ padding: 8 }}>قیمت فروش</th><th style={{ padding: 8 }}>موجودی</th><th style={{ padding: 8 }}>وضعیت</th><th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((p) => (
            <tr key={p.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
              <td style={{ padding: 8 }}>{p.name}</td>
              <td style={{ padding: 8 }}>{p.price.toLocaleString("fa-IR")} تومان</td>
              <td style={{ padding: 8 }}>{p.partner_stock_unlimited ? "نامحدود" : p.stock.toLocaleString("fa-IR")}</td>
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
          ))}
        </tbody>
      </table>
      {filtered.length === 0 && (
        <p style={{ color: "#9ca3af", fontSize: 13, textAlign: "center", padding: 20 }}>
          {products.length === 0 ? "هنوز محصولی ثبت نکرده‌اید." : "محصولی با این نام پیدا نشد."}
        </p>
      )}
    </div>
  );
}