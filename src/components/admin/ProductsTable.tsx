// src/components/admin/ProductsTable.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { deleteProduct } from "@/app/admin/products/actions";

interface Row {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  stock: number | null;
  is_active: boolean;
  images: string[];
  category: { name: string } | null;
}

export default function ProductsTable({ products }: { products: Row[] }) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(p: Row) {
    if (!confirm(`آیا از حذف محصول "${p.name}" مطمئن هستید؟`)) return;
    setDeletingId(p.id);
    const result = await deleteProduct(p.id, p.images);
    setDeletingId(null);
    if (result?.error) alert(result.error);
  }

  return (
    <div className="admin-card">
      <table className="admin-table">
        <thead>
          <tr>
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
          {products.map((p) => (
            <tr key={p.id}>
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
              <td>{p.name}</td>
              <td dir="ltr" className="text-left text-xs">{p.sku}</td>
              <td>{p.category?.name ?? "—"}</td>
              <td>{p.price.toLocaleString("fa-IR")} تومان</td>
              <td>{p.stock !== null ? p.stock.toLocaleString("fa-IR") : "نامحدود"}</td>
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
                <div className="flex gap-2">
                  <Link
                    href={`/admin/products/${p.id}/edit`}
                    className="admin-btn admin-btn-secondary"
                  >
                    <Pencil size={14} />
                  </Link>
                  <button
                    className="admin-btn admin-btn-danger"
                    onClick={() => handleDelete(p)}
                    disabled={deletingId === p.id}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {products.length === 0 && (
        <p className="text-gray-500 text-sm text-center py-6">
          هنوز محصولی ثبت نشده است.
        </p>
      )}
    </div>
  );
}