// src/components/admin/ProductsTable.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { Pencil, Trash2, Layers, Copy, Check, X as XIcon, History } from "lucide-react";
import { deleteProduct, copyProduct, quickUpdateProduct, getProductPriceHistory } from "@/app/admin/products/actions";
import BulkEditModal from "./BulkEditModal";
import { Category } from "@/types";

interface Row {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  stock: number | null;
  is_active: boolean;
  is_stock: boolean;
  images: string[];
  category: { name: string } | null;
}

export default function ProductsTable({
  products,
  categories,
}: {
  products: Row[];
  categories: Category[];
}) {
  const [rows, setRows] = useState(products);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editingCell, setEditingCell] = useState<{ id: string; field: "price" | "stock" } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [historyProductId, setHistoryProductId] = useState<string | null>(null);
  const [historyRows, setHistoryRows] = useState<{ id: string; price: number; discount_price: number | null; changed_at: string }[]>([]);

  const initialized = useRef(false);

  // فقط بار اول rows را با products هماهنگ کن
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      setRows(products);
    }
  }, [products]);

  async function handleDelete(p: Row) {
    if (!confirm(`آیا از حذف محصول "${p.name}" مطمئن هستید؟`)) return;
    setDeletingId(p.id);
    const result = await deleteProduct(p.id, p.images);
    setDeletingId(null);
    if (result?.error) alert(result.error);
    else setRows((prev) => prev.filter((r) => r.id !== p.id));
  }

  async function handleCopy(p: Row) {
    setCopyingId(p.id);
    const result = await copyProduct(p.id);
    setCopyingId(null);
    if (result?.error) alert(result.error);
    else window.location.reload();
  }

  function startEdit(id: string, field: "price" | "stock", currentValue: number | null) {
    setEditingCell({ id, field });
    setEditValue(currentValue?.toString() ?? "");
  }

  async function saveEdit() {
    if (!editingCell) return;
    const value = editValue === "" ? null : Number(editValue);
    const changes = editingCell.field === "price" ? { price: value ?? 0 } : { stock: value };
    const result = await quickUpdateProduct(editingCell.id, changes);
    if (!result?.error) {
      setRows((prev) => prev.map((r) => (r.id === editingCell.id ? { ...r, [editingCell.field]: value } : r)));
    } else alert(result.error);
    setEditingCell(null);
  }

  async function openHistory(id: string) {
    setHistoryProductId(id);
    const data = await getProductPriceHistory(id);
    setHistoryRows(data);
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(
      selected.size === rows.length
        ? new Set()
        : new Set(rows.map((p) => p.id))
    );
  }

  return (
    <div className="admin-card">
      {selected.size > 0 && (
        <div className="bulk-toolbar">
          <span>{selected.size.toLocaleString("fa-IR")} محصول انتخاب شده</span>
          <button
            onClick={() => setShowBulkModal(true)}
            className="admin-btn admin-btn-primary flex items-center gap-1"
          >
            <Layers size={14} /> ویرایش گروهی
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="admin-btn admin-btn-secondary"
          >
            لغو انتخاب
          </button>
        </div>
      )}

      <table className="admin-table">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={selected.size === rows.length && rows.length > 0}
                onChange={toggleAll}
              />
            </th>
            <th>تصویر</th>
            <th>نام</th>
            <th>کد محصول</th>
            <th>دسته‌بندی</th>
            <th>قیمت</th>
            <th>موجودی</th>
            <th>وضعیت</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => {
            const lowStock = p.stock !== null && p.stock < 5;
            return (
              <tr key={p.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => toggleOne(p.id)}
                  />
                </td>
                <td>
                  {p.images?.[0] ? (
                    <Image
                      src={p.images[0]}
                      alt={p.name}
                      width={48}
                      height={48}
                      className="w-12 h-12 object-cover rounded-lg"
                      unoptimized
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded-lg" />
                  )}
                </td>
                <td>
                  {p.name}
                  {p.is_stock && (
                    <span className="badge badge-warning" style={{ marginRight: 6 }}>
                      استوک
                    </span>
                  )}
                </td>
                <td dir="ltr" className="text-left text-xs">
                  {p.sku}
                </td>
                <td>{p.category?.name ?? "—"}</td>
                <td onDoubleClick={() => startEdit(p.id, "price", p.price)} className="inline-edit-cell">
                  {editingCell?.id === p.id && editingCell.field === "price" ? (
                    <div className="flex items-center gap-1">
                      <input autoFocus type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="admin-input" style={{ width: 100 }} />
                      <button onClick={saveEdit}><Check size={14} className="text-green-600" /></button>
                      <button onClick={() => setEditingCell(null)}><XIcon size={14} className="text-red-500" /></button>
                    </div>
                  ) : (
                    <span title="دوبار کلیک برای ویرایش سریع">{p.price.toLocaleString("fa-IR")} تومان</span>
                  )}
                </td>
                <td onDoubleClick={() => startEdit(p.id, "stock", p.stock)} className="inline-edit-cell">
                  {editingCell?.id === p.id && editingCell.field === "stock" ? (
                    <div className="flex items-center gap-1">
                      <input autoFocus type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="admin-input" style={{ width: 80 }} />
                      <button onClick={saveEdit}><Check size={14} className="text-green-600" /></button>
                      <button onClick={() => setEditingCell(null)}><XIcon size={14} className="text-red-500" /></button>
                    </div>
                  ) : (
                    <span title="دوبار کلیک برای ویرایش سریع" className={lowStock ? "text-red-600 font-bold" : ""}>
                      {p.stock !== null ? p.stock.toLocaleString("fa-IR") : "نامحدود"}
                      {lowStock && <span className="badge badge-danger" style={{ marginRight: 6 }}>موجودی کم</span>}
                    </span>
                  )}
                </td>
                <td>
                  <span
                    className={
                      p.is_active
                        ? "text-green-600 text-xs font-medium"
                        : "text-gray-400 text-xs font-medium"
                    }
                  >
                    {p.is_active ? "فعال" : "غیرفعال"}
                  </span>
                </td>
                <td>
                  <div className="flex gap-1">
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="admin-btn admin-btn-secondary"
                    >
                      <Pencil size={13} />
                    </Link>
                    <button onClick={() => handleCopy(p)} disabled={copyingId === p.id} className="admin-btn admin-btn-secondary">
                      <Copy size={13} />
                    </button>
                    <button onClick={() => openHistory(p.id)} className="admin-btn admin-btn-secondary">
                      <History size={13} />
                    </button>
                    <button
                      className="admin-btn admin-btn-danger"
                      onClick={() => handleDelete(p)}
                      disabled={deletingId === p.id}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {rows.length === 0 && (
        <p className="text-gray-500 text-sm text-center py-6">
          هنوز محصولی ثبت نشده است.
        </p>
      )}

      {showBulkModal && (
        <BulkEditModal
          productIds={Array.from(selected)}
          categories={categories}
          onClose={() => setShowBulkModal(false)}
          onDone={() => {
            setShowBulkModal(false);
            setSelected(new Set());
            window.location.reload();
          }}
        />
      )}

      {historyProductId && (
        <div className="admin-modal-overlay" onClick={() => setHistoryProductId(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">تاریخچه قیمت</h2>
              <button onClick={() => setHistoryProductId(null)}><XIcon size={20} /></button>
            </div>
            <table className="admin-table">
              <thead><tr><th>قیمت</th><th>قیمت تخفیف</th><th>تاریخ</th></tr></thead>
              <tbody>
                {historyRows.map((h) => (
                  <tr key={h.id}>
                    <td>{h.price.toLocaleString("fa-IR")}</td>
                    <td>{h.discount_price ? h.discount_price.toLocaleString("fa-IR") : "—"}</td>
                    <td className="text-xs text-gray-500">{new Date(h.changed_at).toLocaleString("fa-IR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {historyRows.length === 0 && <p className="text-gray-500 text-sm text-center py-6">تاریخچه‌ای ثبت نشده.</p>}
          </div>
        </div>
      )}
    </div>
  );
}