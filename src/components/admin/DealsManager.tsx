"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Plus } from "lucide-react";
import {
  toggleDealsEnabled,
  toggleProductDeal,
} from "@/app/admin/deals/actions";
import AdminSwitch from "./AdminSwitch";

interface ProductRow {
  id: string;
  name: string;
  images: string[];
  price: number;
  discount_price: number | null;
  is_deal: boolean;
}

export default function DealsManager({
  dealsEnabled,
  products,
}: {
  dealsEnabled: boolean;
  products: ProductRow[];
}) {
  const [enabled, setEnabled] = useState(dealsEnabled);
  const [rows, setRows] = useState(products);
  const [filter, setFilter] = useState("");

  async function handleToggleEnabled(newValue: boolean) {
    setEnabled(newValue);
    await toggleDealsEnabled(newValue);
  }

  async function handleSetDeal(p: ProductRow, value: boolean) {
    if (value && !p.discount_price) {
      alert(
        "برای افزودن این محصول به جشنواره، ابتدا قیمت تخفیف آن را در ویرایش محصول تنظیم کنید."
      );
      return;
    }
    setRows((prev) =>
      prev.map((r) => (r.id === p.id ? { ...r, is_deal: value } : r))
    );
    await toggleProductDeal(p.id, value);
  }

  const inDeal = rows.filter((p) => p.is_deal);
  const notInDeal = rows.filter((p) => !p.is_deal && p.name.includes(filter));

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">جشنواره تخفیف</h1>
        <AdminSwitch
          checked={enabled}
          onChange={handleToggleEnabled}
          label={
            enabled
              ? "این بخش در صفحه اصلی فعال است"
              : "این بخش غیرفعال است"
          }
        />
      </div>

      <div className="admin-card mb-5">
        <h2 className="font-bold text-gray-800 mb-3">
          محصولات موجود در جشنواره ({inDeal.length.toLocaleString("fa-IR")})
        </h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>تصویر</th>
              <th>نام</th>
              <th>قیمت</th>
              <th>قیمت تخفیف</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {inDeal.map((p) => (
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
                <td>{p.price.toLocaleString("fa-IR")}</td>
                <td>{p.discount_price?.toLocaleString("fa-IR")}</td>
                <td>
                  <button
                    onClick={() => handleSetDeal(p, false)}
                    className="admin-btn admin-btn-danger flex items-center gap-1"
                  >
                    <X size={14} /> حذف از جشنواره
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {inDeal.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-6">
            هنوز محصولی به جشنواره اضافه نشده.
          </p>
        )}
      </div>

      <div className="admin-card">
        <h2 className="font-bold text-gray-800 mb-3">افزودن محصول به جشنواره</h2>
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
              <th>قیمت تخفیف</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {notInDeal.map((p) => (
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
                <td>{p.price.toLocaleString("fa-IR")}</td>
                <td>
                  {p.discount_price
                    ? p.discount_price.toLocaleString("fa-IR")
                    : "—"}
                </td>
                <td>
                  <button
                    onClick={() => handleSetDeal(p, true)}
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