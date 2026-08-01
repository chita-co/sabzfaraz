// src/app/admin/products/page.tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Plus, Download } from "lucide-react";
import ProductsTable from "@/components/admin/ProductsTable";
import AdminProductFilters from "@/components/admin/AdminProductFilters";
import Pagination from "@/components/shop/Pagination";

const PAGE_SIZE = 20;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    status?: string;
    page?: string;
  }>;
}) {
  const { q, category, status, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("*, category:categories(name)", { count: "exact" });

  if (q)
    query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%,name_en.ilike.%${q}%`);
  if (category) query = query.eq("category_id", category);
  if (status === "active") query = query.eq("is_active", true);
  else if (status === "inactive") query = query.eq("is_active", false);
  else if (status === "low-stock")
    query = query.not("stock", "is", null).lt("stock", 5);

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  query = query.order("created_at", { ascending: false }).range(from, to);

  const [{ data: products, count }, { data: categories }] = await Promise.all([
    query,
    supabase.from("categories").select("*").order("name"),
  ]);

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const extraParams: Record<string, string> = {};
  if (q) extraParams.q = q;
  if (category) extraParams.category = category;
  if (status) extraParams.status = status;

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h1 className="text-xl font-bold text-gray-900">مدیریت محصولات</h1>
        <div className="flex gap-2">
          <a
            href="/api/admin/products-csv"
            className="admin-btn admin-btn-secondary flex items-center gap-2"
          >
            <Download size={16} /> خروجی CSV
          </a>
          <Link
            href="/admin/products/new"
            className="admin-btn admin-btn-primary flex items-center gap-2"
          >
            <Plus size={16} />
            محصول جدید
          </Link>
        </div>
      </div>

      <AdminProductFilters categories={categories ?? []} />
      <p className="text-sm text-gray-500 mb-3">
        {(count ?? 0).toLocaleString("fa-IR")} محصول
      </p>

      <ProductsTable
        products={products ?? []}
        categories={categories ?? []}
      />

      <Pagination
        basePath="/admin/products"
        currentPage={page}
        totalPages={totalPages}
        extraParams={extraParams}
      />
    </div>
  );
}