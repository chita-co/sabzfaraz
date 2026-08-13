"use client";

import { useState, useCallback, useRef } from "react";
import { Search, Download, Plus } from "lucide-react";
import Link from "next/link";
import ProductsTable from "./ProductsTable";
import { Category } from "@/types";

interface Filters { q: string; category: string; status: string; page: number; pageSize: number; }
interface ProductRow {
  id: string; name: string; slug: string; sku: string; price: number; stock: number | null;
  is_active: boolean; is_stock: boolean; images: string[]; category: { name: string } | null;
}

const PAGE_SIZES = [20, 50, 100];

export default function AdminProductsListClient({
  initialProducts, initialCount, categories, initialFilters,
}: {
  initialProducts: ProductRow[]; initialCount: number; categories: Category[]; initialFilters: Filters;
}) {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [qInput, setQInput] = useState(initialFilters.q);
  const [products, setProducts] = useState<ProductRow[]>(initialProducts);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const fetchProducts = useCallback(async (next: Filters) => {
    const id = ++requestId.current;
    setLoading(true);
    const params = new URLSearchParams();
    if (next.q) params.set("q", next.q);
    if (next.category) params.set("category", next.category);
    if (next.status) params.set("status", next.status);
    params.set("page", String(next.page));
    params.set("pageSize", String(next.pageSize));

    try {
      const res = await fetch(`/api/admin/products-list?${params.toString()}`);
      const data = await res.json();
      if (id !== requestId.current) return;
      if (res.ok) {
        setProducts(data.products);
        setCount(data.count);
        setError(null);
        window.history.replaceState(null, "", `/admin/products?${params.toString()}`);
      } else {
        setError(data.error || "خطا در دریافت لیست محصولات.");
      }
    } catch {
      if (id === requestId.current) setError("خطا در ارتباط با سرور. اتصال اینترنت را بررسی کنید.");
    }
    if (id === requestId.current) setLoading(false);
  }, []);

  function applyFilters(changes: Partial<Filters>) {
    const next = { ...filters, ...changes, page: changes.page ?? 1 };
    setFilters(next);
    fetchProducts(next);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    applyFilters({ q: qInput });
  }

  function handleRefresh() {
    fetchProducts(filters);
  }

  const totalPages = Math.max(1, Math.ceil(count / filters.pageSize));
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - filters.page) <= 1
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h1 className="text-xl font-bold text-gray-900">مدیریت محصولات</h1>
        <div className="flex gap-2">
          <a href="/api/admin/products-csv" className="admin-btn admin-btn-secondary flex items-center gap-2">
            <Download size={16} /> خروجی CSV
          </a>
          <Link href="/admin/products/new" className="admin-btn admin-btn-primary flex items-center gap-2">
            <Plus size={16} /> محصول جدید
          </Link>
        </div>
      </div>

      <div className="admin-filters-bar">
        <form onSubmit={handleSearchSubmit} className="admin-filters-search">
          <Search size={15} />
          <input
            type="text"
            placeholder="جستجو در نام یا کد محصول..."
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
          />
          <button type="submit" className="admin-filters-apply-btn">اعمال</button>
        </form>

        <select value={filters.category} onChange={(e) => applyFilters({ category: e.target.value })} className="admin-input">
          <option value="">همه دسته‌بندی‌ها</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select value={filters.status} onChange={(e) => applyFilters({ status: e.target.value })} className="admin-input">
          <option value="">همه وضعیت‌ها</option>
          <option value="active">فعال</option>
          <option value="inactive">غیرفعال</option>
          <option value="low-stock">موجودی کم (کمتر از ۵)</option>
          <option value="out-of-stock">تمام‌شده</option>
        </select>

        <select value={filters.pageSize} onChange={(e) => applyFilters({ pageSize: Number(e.target.value) })} className="admin-input">
          {PAGE_SIZES.map((n) => <option key={n} value={n}>{n.toLocaleString("fa-IR")} محصول در صفحه</option>)}
        </select>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <p className="text-sm text-gray-500 mb-3">
        {loading ? "در حال بارگذاری..." : `${count.toLocaleString("fa-IR")} محصول`}
      </p>

      <ProductsTable products={products} categories={categories} onRefresh={handleRefresh} />

      {totalPages > 1 && (
        <div className="admin-pagination-bar">
          <button onClick={() => applyFilters({ page: Math.max(1, filters.page - 1) })} disabled={filters.page <= 1} className="admin-pagination-arrow">قبلی</button>
          {pages.map((p, i) => (
            <span key={p} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {i > 0 && pages[i - 1] !== p - 1 && <span className="pagination-dots">...</span>}
              <button onClick={() => applyFilters({ page: p })} className={`admin-pagination-page${p === filters.page ? " active" : ""}`}>
                {p.toLocaleString("fa-IR")}
              </button>
            </span>
          ))}
          <button onClick={() => applyFilters({ page: Math.min(totalPages, filters.page + 1) })} disabled={filters.page >= totalPages} className="admin-pagination-arrow">بعدی</button>
        </div>
      )}
    </div>
  );
}