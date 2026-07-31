"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Plus } from "lucide-react";
import { toggleStockEnabled, toggleProductStock } from "@/app/admin/stock/actions";
import AdminSwitch from "./AdminSwitch";

interface ProductRow {
  id: string;
  name: string;
  images: string[];
  price: number;
  discount_price: number | null;
  is_stock: boolean;
}

export default function StockManager({
  stockEnabled,
  products,
}: {
  stockEnabled: boolean;
  products: ProductRow[];
}) {
  const [enabled, setEnabled] = useState(stockEnabled);
  const [rows, setRows] = useState(products);
  const [filter, setFilter] = useState("");

  async function handleToggleEnabled(value: boolean) {
    setEnabled(value);
    await toggleStockEnabled(value);
  }

  async function handleSetStock(id: string, value: boolean) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_stock: value } : r))
    );
    await toggleProductStock(id, value);
  }

  const inStock = rows.filter((p) => p.is_stock);
  const notInStock = rows.filter((p) => !p.is_stock && p.name.includes(filter));

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">محصولات استوک</h1>
        <AdminSwitch
          checked={enabled}
          onChange={handleToggleEnabled}
          label={enabled ? "فعال در صفحه اصلی" : "غیرفعال"}
        />
      </div>

      <div className="admin-card mb-5">
        <h2 className="font-bold text-gray-800 mb-3">
          محصولات موجود در این بخش ({inStock.length.toLocaleString("fa-IR")})
        </h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>تصویر</th>
              <th>نام</th>
              <th>قیمت</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {inStock.map((p) => (
              <tr key={p.id}>
                <td>
                  {p.images?.[0] ? (
                    <Image
                      src={p.images[0]}
                      alt=""
                      width={48}
                      height={48}
                      className="object-cover rounded-lg"
                      unoptimized
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded-lg" />
                  )}
                </td>
                <td>{p.name}</td>
                <td>
                  {(p.discount_price ?? p.price).toLocaleString("fa-IR")} تومان
                </td>
                <td>
                  <button
                    onClick={() => handleSetStock(p.id, false)}
                    className="admin-btn admin-btn-danger flex items-center gap-1"
                  >
                    <X size={14} /> حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {inStock.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-6">
            هنوز محصولی اضافه نشده.
          </p>
        )}
      </div>

      <div className="admin-card">
        <h2 className="font-bold text-gray-800 mb-3">افزودن محصول</h2>
        <input
          type="text"
          placeholder="جستجوی محصول..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="admin-input mb-4 w-full sm:w-72"
        />
        <table className="admin-table">
          <thead>
            <tr>
              <th>تصویر</th>
              <th>نام</th>
              <th>قیمت</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {notInStock.map((p) => (
              <tr key={p.id}>
                <td>
                  {p.images?.[0] ? (
                    <Image
                      src={p.images[0]}
                      alt=""
                      width={48}
                      height={48}
                      className="object-cover rounded-lg"
                      unoptimized
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded-lg" />
                  )}
                </td>
                <td>{p.name}</td>
                <td>
                  {(p.discount_price ?? p.price).toLocaleString("fa-IR")} تومان
                </td>
                <td>
                  <button
                    onClick={() => handleSetStock(p.id, true)}
                    className="admin-btn admin-btn-primary flex items-center gap-1"
                  >
                    <Plus size={14} /> افزودن
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}