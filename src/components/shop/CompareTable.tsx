"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import type { CompareCell, CompareGroup } from "@/lib/compare/parse";

export interface TableProduct {
  slug: string;
  name: string;
  image: string | null;
  inStock: boolean;
  cheapest: boolean;
  finalLabel: string;
  oldLabel: string | null;
  discountPercent: number | null;
  unit: string | null;
  removeHref: string;
}

type Mode = "all" | "diff" | "same";

const cellBase: React.CSSProperties = { padding: "10px 12px", borderBottom: "1px solid #eef2f0", verticalAlign: "top", fontSize: 13, color: "#374151", lineHeight: 1.9 };
const labelBase: React.CSSProperties = { ...cellBase, position: "sticky", right: 0, zIndex: 1, fontWeight: 700, color: "#111827", textAlign: "right" };

function Cell({ value }: { value: CompareCell }) {
  if (value === null) return <span style={{ color: "#c4c9d0" }}>—</span>;
  if (typeof value === "string") return <>{value}</>;
  return (
    <ul className="cmp-list" style={{ margin: 0, paddingRight: 16, listStyle: "disc" }}>
      {value.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export default function CompareTable({
  products,
  groups,
  same,
  diff,
}: {
  products: TableProduct[];
  groups: CompareGroup[];
  same: number;
  diff: number;
}) {
  const [mode, setMode] = useState<Mode>("all");
  const [copied, setCopied] = useState(false);

  const total = same + diff;
  const percent = total > 0 ? Math.round((same / total) * 100) : 0;
  const n = products.length;

  const visibleGroups = groups
    .map((g) => ({
      ...g,
      rows: g.rows.filter((r) => !g.filterable || mode === "all" || (mode === "diff" ? r.same === false : r.same === true)),
    }))
    .filter((g) => g.rows.length > 0);
  const hasFilterableRows = visibleGroups.some((g) => g.filterable);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* مرورگر اجازه نداد؛ مهم نیست */
    }
  }

  const tabs: { id: Mode; label: string }[] = [
    { id: "all", label: "همه ویژگی‌ها" },
    { id: "diff", label: `فقط تفاوت‌ها (${diff.toLocaleString("fa-IR")})` },
    { id: "same", label: `فقط شباهت‌ها (${same.toLocaleString("fa-IR")})` },
  ];

  return (
    <div className="cmp-root" style={{ marginTop: 20 }}>
      {/* نوار خلاصه + حالت نمایش */}
      <div className="cmp-summary" style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center", justifyContent: "space-between", background: "linear-gradient(135deg,#f0fdf4,#fefce8)", border: "1px solid #dcfce7", borderRadius: 14, padding: "12px 16px", marginBottom: 14 }}>
        <div className="cmp-summary-text" style={{ minWidth: 220, flex: "1 1 260px" }}>
          {total > 0 ? (
            <>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#14532d", marginBottom: 6 }}>
                {percent.toLocaleString("fa-IR")}٪ شباهت — {same.toLocaleString("fa-IR")} مشخصه یکسان و {diff.toLocaleString("fa-IR")} مشخصه متفاوت
              </div>
              <div style={{ height: 8, background: "#e5e7eb", borderRadius: 999, overflow: "hidden" }}>
                <div style={{ width: `${percent}%`, height: "100%", background: "linear-gradient(90deg,#16a34a,#fbbf24)" }} />
              </div>
            </>
          ) : (
            <div style={{ fontSize: 13, color: "#4b5563" }}>برای تحلیل شباهت‌ها، مشخصات فنی بیشتری لازم است.</div>
          )}
        </div>

        <div className="cmp-actions" style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <div className="cmp-tabs" role="tablist" aria-label="حالت نمایش" style={{ display: "inline-flex", background: "#fff", border: "1px solid #d1d5db", borderRadius: 999, padding: 3 }}>
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={mode === t.id}
                onClick={() => setMode(t.id)}
                style={{ border: "none", cursor: "pointer", borderRadius: 999, padding: "6px 14px", fontSize: 12.5, fontWeight: 700, fontFamily: "inherit", background: mode === t.id ? "#15803d" : "transparent", color: mode === t.id ? "#fff" : "#374151" }}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button className="cmp-copy" type="button" onClick={copyLink} style={{ border: "1px solid #d1d5db", background: "#fff", borderRadius: 999, padding: "7px 14px", fontSize: 12.5, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", color: "#374151" }}>
            {copied ? "✓ لینک کپی شد" : "کپی لینک مقایسه"}
          </button>
        </div>
      </div>

      {/* راهنمای اسکرول افقی (فقط موبایل و وقتی ۳ محصول یا بیشتر است) */}
      {n >= 3 && <p className="cmp-scroll-hint">↔ برای دیدن همه‌ی محصولات، جدول را افقی بکشید</p>}

      {/* جدول */}
      <div className="cmp-scroll" style={{ overflowX: "auto", border: "1px solid #e5e7eb", borderRadius: 14, background: "#fff" }}>
        <table className="cmp-table" style={{ width: "100%", minWidth: 150 + n * 210, borderCollapse: "separate", borderSpacing: 0, tableLayout: "fixed", ["--cmp-n" as string]: n } as React.CSSProperties}>
          <colgroup>
            <col className="cmp-col-label" style={{ width: 150 }} />
            {products.map((p) => (
              <col className="cmp-col-prod" key={p.slug} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th className="cmp-label" style={{ ...labelBase, background: "#fff", borderBottom: "2px solid #16a34a" }} />
              {products.map((p) => (
                <th className="cmp-th" key={p.slug} style={{ ...cellBase, borderBottom: "2px solid #16a34a", padding: 10, textAlign: "center", verticalAlign: "top" }}>
                  <div className="cmp-pcard" style={{ position: "relative", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 10px 12px", background: "#fafafa" }}>
                    <Link className="cmp-remove" href={p.removeHref} title="حذف از مقایسه" aria-label={`حذف ${p.name} از مقایسه`} style={{ position: "absolute", top: 6, left: 6, width: 22, height: 22, lineHeight: "21px", borderRadius: "50%", background: "#f3f4f6", color: "#6b7280", fontSize: 12, textDecoration: "none" }}>
                      ✕
                    </Link>
                    {p.cheapest && (
                      <span className="cmp-cheap" style={{ position: "absolute", top: 6, right: 6, background: "#fbbf24", color: "#111827", fontSize: 10.5, fontWeight: 800, borderRadius: 999, padding: "2px 8px" }}>
                        ارزان‌ترین
                      </span>
                    )}
                    <Link className="cmp-plink" href={`/products/${p.slug}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, color: "#111827", textDecoration: "none", marginTop: 14 }}>
                      {p.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img className="cmp-img" src={p.image} alt={p.name} width={84} height={84} style={{ objectFit: "contain", borderRadius: 10, background: "#fff" }} />
                      ) : (
                        <span className="cmp-img" style={{ width: 84, height: 84, borderRadius: 10, background: "#f3f4f6" }} />
                      )}
                      <span className="cmp-pname" style={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.8, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.name}</span>
                    </Link>
                    <div className="cmp-price" style={{ marginTop: 8, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                      {p.oldLabel && (
                        <span className="cmp-price-old" style={{ fontSize: 11.5, color: "#9ca3af", textDecoration: "line-through" }}>{p.oldLabel}</span>
                      )}
                      <span className="cmp-price-final" style={{ fontSize: 14, fontWeight: 800, color: p.oldLabel ? "#dc2626" : "#111827" }}>
                        {p.finalLabel} <span style={{ fontSize: 11, fontWeight: 600 }}>تومان</span>
                      </span>
                      {p.unit && <span style={{ fontSize: 11, color: "#6b7280" }}>/ هر {p.unit}</span>}
                      {p.discountPercent !== null && p.discountPercent > 0 && (
                        <span className="cmp-disc" style={{ background: "#fee2e2", color: "#b91c1c", fontSize: 11, fontWeight: 800, borderRadius: 999, padding: "1px 8px", marginTop: 2 }}>
                          {p.discountPercent.toLocaleString("fa-IR")}٪ تخفیف
                        </span>
                      )}
                    </div>
                    <span className="cmp-stock" style={{ display: "inline-block", marginTop: 8, fontSize: 11, fontWeight: 700, borderRadius: 999, padding: "2px 10px", background: p.inStock ? "#dcfce7" : "#f3f4f6", color: p.inStock ? "#166534" : "#6b7280" }}>
                      {p.inStock ? "موجود" : "ناموجود"}
                    </span>
                    <Link className="cmp-view" href={`/products/${p.slug}`} style={{ display: "block", marginTop: 10, border: "1px solid #16a34a", color: "#15803d", borderRadius: 8, padding: "5px 0", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
                      مشاهده محصول
                    </Link>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleGroups.map((g) => (
              <Fragment key={g.id}>
                <tr>
                  <td className="cmp-group" colSpan={n + 1} style={{ background: "linear-gradient(90deg,#166534,#15803d)", color: "#fff", fontWeight: 800, fontSize: 13, padding: "8px 14px" }}>
                    <span style={{ position: "sticky", right: 14, display: "inline-block" }}>{g.title}</span>
                  </td>
                </tr>
                {g.rows.map((row) => {
                  const bg = g.filterable ? (row.same === false ? "#fffbeb" : "#f0fdf4") : "#fff";
                  return (
                    <tr key={`${g.id}:${row.label}`}>
                      <th className="cmp-label" scope="row" style={{ ...labelBase, background: bg }}>
                        <div>{row.label}</div>
                        {g.filterable && (
                          <span className="cmp-badge" style={{ display: "inline-block", marginTop: 3, fontSize: 10.5, fontWeight: 800, borderRadius: 999, padding: "0 7px", background: row.same ? "#bbf7d0" : "#fde68a", color: row.same ? "#14532d" : "#78350f" }}>
                            {row.same ? "✓ یکسان" : "≠ متفاوت"}
                          </span>
                        )}
                      </th>
                      {row.cells.map((c, i) => (
                        <td className="cmp-td" key={i} style={{ ...cellBase, background: bg }}>
                          <Cell value={c} />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </Fragment>
            ))}
            {mode !== "all" && !hasFilterableRows && (
              <tr>
                <td colSpan={n + 1} style={{ ...cellBase, textAlign: "center", padding: 24, color: "#6b7280" }}>
                  {mode === "diff" ? "هیچ تفاوتی بین این محصولات پیدا نشد." : "هیچ مشخصه‌ی یکسانی بین این محصولات پیدا نشد."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}