// src/components/admin/AdminProductPicker.tsx
// لیست محصولات با تیک انتخاب (تصویر، نام، دسته‌بندی فعلی) + دکمه‌ی «تغییر دسته‌بندی»
"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { Shapes } from "lucide-react";
import { buildPaths, type RTCategory, type RTProduct } from "@/components/shared/RecategorizeTable";
import { listProductsForRecategorizeAction } from "@/app/admin/categories/recategorize-actions";

interface ListResult {
  key: string;
  products: RTProduct[];
  total: number;
  pageSize: number;
  error: string | null;
}

export default function AdminProductPicker({
  categories,
  onStart,
}: {
  categories: RTCategory[];
  onStart: (products: RTProduct[]) => void;
}) {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [result, setResult] = useState<ListResult | null>(null);
  const [selected, setSelected] = useState<Record<string, RTProduct>>({});
  const paths = useMemo(() => buildPaths(categories), [categories]);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedQ(q); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [q]);

  const requestKey = `${debouncedQ}|${page}`;

  useEffect(() => {
    let cancelled = false;
    listProductsForRecategorizeAction({ q: debouncedQ, page }).then((res) => {
      if (cancelled) return;
      setResult({
        key: requestKey,
        products: res.products ?? [],
        total: res.total ?? 0,
        pageSize: res.pageSize ?? 30,
        error: res.error ?? null,
      });
    });
    return () => { cancelled = true; };
  }, [debouncedQ, page, requestKey]);

  const loading = result?.key !== requestKey;
  const products = result?.products ?? [];
  const total = result?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / (result?.pageSize ?? 30)));
  const count = Object.keys(selected).length;
  const allChecked = products.length > 0 && products.every((p) => selected[p.id]);

  function toggle(p: RTProduct) {
    setSelected((prev) => {
      const n = { ...prev };
      if (n[p.id]) delete n[p.id];
      else n[p.id] = p;
      return n;
    });
  }
  function toggleAll() {
    setSelected((prev) => {
      const n = { ...prev };
      if (allChecked) products.forEach((p) => delete n[p.id]);
      else products.forEach((p) => { n[p.id] = p; });
      return n;
    });
  }
  function start() {
    if (count === 0) return toast.error("ابتدا چند محصول را تیک بزنید.");
    onStart(Object.values(selected));
  }

  const th: React.CSSProperties = { padding: 8, textAlign: "right", color: "#6b7280", fontWeight: 600 };

  return (
    <div className="admin-card">
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <button
          type="button"
          onClick={start}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", fontSize: 13, fontWeight: 700, borderRadius: 10, border: "1px solid #16a34a", background: "#16a34a", color: "#fff", cursor: "pointer", opacity: count === 0 ? 0.6 : 1 }}
        >
          <Shapes size={15} /> تغییر دسته‌بندی ({count.toLocaleString("fa-IR")} محصول)
        </button>
        {count > 0 && (
          <button type="button" onClick={() => setSelected({})} style={{ padding: "6px 12px", fontSize: 12, borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer" }}>
            لغو انتخاب‌ها
          </button>
        )}
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="جستجوی نام محصول..."
          style={{ border: "1px solid #d1d5db", borderRadius: 8, padding: "6px 12px", fontSize: 13, minWidth: 240 }}
        />
        <span style={{ fontSize: 12, color: "#6b7280" }}>
          {total.toLocaleString("fa-IR")} محصول {loading && "— در حال بارگذاری..."}
        </span>
      </div>
      {result?.error && <p style={{ color: "#dc2626", fontSize: 13 }}>{result.error}</p>}

      <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #f3f4f6" }}>
            <th style={{ ...th, width: 32 }}>
              <input type="checkbox" checked={allChecked} onChange={toggleAll} aria-label="انتخاب همه‌ی این صفحه" />
            </th>
            <th style={th}>تصویر</th>
            <th style={th}>نام</th>
            <th style={th}>دسته‌بندی فعلی</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} style={{ borderBottom: "1px solid #f3f4f6", background: selected[p.id] ? "#f0fdf4" : undefined }}>
              <td style={{ padding: 8 }}>
                <input type="checkbox" checked={!!selected[p.id]} onChange={() => toggle(p)} aria-label="انتخاب محصول" />
              </td>
              <td style={{ padding: 8 }}>
                {p.image ? (
                  <Image src={p.image} alt={p.name} width={56} height={56} unoptimized style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8 }} />
                ) : (
                  <div style={{ width: 56, height: 56, background: "#f3f4f6", borderRadius: 8 }} />
                )}
              </td>
              <td style={{ padding: 8 }}>{p.name}</td>
              <td style={{ padding: 8, color: "#374151" }}>{p.category_id ? paths.get(p.category_id) ?? "—" : "بدون دسته‌بندی"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!loading && products.length === 0 && (
        <p style={{ color: "#9ca3af", fontSize: 13, textAlign: "center", padding: 20 }}>محصولی پیدا نشد.</p>
      )}

      {pages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 12, alignItems: "center", fontSize: 13 }}>
          <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)} style={{ padding: "4px 12px", border: "1px solid #d1d5db", borderRadius: 8, background: "#fff" }}>قبلی</button>
          <span>{page.toLocaleString("fa-IR")} از {pages.toLocaleString("fa-IR")}</span>
          <button type="button" disabled={page >= pages || loading} onClick={() => setPage((p) => p + 1)} style={{ padding: "4px 12px", border: "1px solid #d1d5db", borderRadius: 8, background: "#fff" }}>بعدی</button>
        </div>
      )}
    </div>
  );
}