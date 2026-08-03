"use client";

import { useState, useCallback, useRef } from "react";
import ProductCard from "./ProductCard";
import { Product } from "@/types";

interface Props {
  mode: "all" | "newest" | "popular" | "category";
  categoryId?: string;
  sort: string;
  initialProducts: Product[];
  initialCount: number;
  initialPage: number;
  initialPageSize: number;
  initialWishlistIds: string[];
  basePath: string;
}

const PAGE_SIZES = [20, 50, 100];

export default function ProductListClient({
  mode, categoryId, sort, initialProducts, initialCount, initialPage, initialPageSize, initialWishlistIds, basePath,
}: Props) {
  const [products, setProducts] = useState(initialProducts);
  const [count, setCount] = useState(initialCount);
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set(initialWishlistIds));
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);

  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  const fetchPage = useCallback(async (nextPage: number, nextPageSize: number) => {
    const id = ++requestId.current;
    setLoading(true);
    const params = new URLSearchParams();
    params.set("mode", mode);
    if (categoryId) params.set("categoryId", categoryId);
    params.set("sort", sort);
    params.set("page", String(nextPage));
    params.set("pageSize", String(nextPageSize));

    try {
      const res = await fetch(`/api/products-list?${params.toString()}`);
      const data = await res.json();
      if (id !== requestId.current) return;
      if (res.ok) {
        setProducts(data.products);
        setCount(data.count);
        setWishlistIds(new Set(data.wishlistIds));
        const urlParams = new URLSearchParams();
        urlParams.set("sort", sort);
        urlParams.set("page", String(nextPage));
        urlParams.set("pageSize", String(nextPageSize));
        window.history.replaceState(null, "", `${basePath}?${urlParams.toString()}`);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch {
      // خطای شبکه؛ بی‌صدا نادیده گرفته می‌شود
    }
    if (id === requestId.current) setLoading(false);
  }, [mode, categoryId, sort, basePath]);

  function handlePageChange(p: number) { setPage(p); fetchPage(p, pageSize); }
  function handlePageSizeChange(size: number) { setPageSize(size); setPage(1); fetchPage(1, size); }

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
  );

  return (
    <>
      {products.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" style={{ opacity: loading ? 0.6 : 1, transition: "opacity 0.2s" }}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} isWishlisted={wishlistIds.has(product.id)} />
          ))}
        </div>
      ) : (
        <p className="text-gray-300">محصولی یافت نشد.</p>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between flex-wrap gap-3 mt-6">
          <select value={pageSize} onChange={(e) => handlePageSizeChange(Number(e.target.value))} className="page-size-select page-size-select-dark">
            {PAGE_SIZES.map((n) => <option key={n} value={n}>{n.toLocaleString("fa-IR")} محصول در صفحه</option>)}
          </select>

          <div className="pagination-bar pagination-bar-dark">
            <button onClick={() => handlePageChange(Math.max(1, page - 1))} disabled={page <= 1} className="pagination-arrow">‹</button>
            {pages.map((p, i) => (
              <span key={p} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {i > 0 && pages[i - 1] !== p - 1 && <span className="pagination-dots">...</span>}
                <button onClick={() => handlePageChange(p)} className={`pagination-page${p === page ? " active" : ""}`}>
                  {p.toLocaleString("fa-IR")}
                </button>
              </span>
            ))}
            <button onClick={() => handlePageChange(Math.min(totalPages, page + 1))} disabled={page >= totalPages} className="pagination-arrow">›</button>
          </div>
        </div>
      )}
    </>
  );
}