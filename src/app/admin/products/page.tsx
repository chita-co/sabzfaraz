// src/app/admin/products/page.tsx
import { createClient } from "@/lib/supabase/server";
import AdminProductsListClient from "@/components/admin/AdminProductsListClient";

const ALLOWED_PAGE_SIZES = [20, 50, 100];

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    status?: string;
    page?: string;
    pageSize?: string;
  }>;
}) {
  const { q, category, status, page: pageParam, pageSize: pageSizeParam } = await searchParams;
  const pageSize = ALLOWED_PAGE_SIZES.includes(Number(pageSizeParam)) ? Number(pageSizeParam) : 20;
  const page = Math.max(1, Number(pageParam) || 1);

  const supabase = await createClient();

  let query = supabase
  .from("products")
  .select("*, category:categories!products_category_id_fkey(name)", { count: "exact" });

  if (q)
    query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%,name_en.ilike.%${q}%`);
  if (category) query = query.eq("category_id", category);
  if (status === "active") query = query.eq("is_active", true);
  else if (status === "inactive") query = query.eq("is_active", false);
  else if (status === "low-stock")
    query = query.not("stock", "is", null).lt("stock", 5).gt("stock", 0);
  else if (status === "out-of-stock")
    query = query.eq("stock", 0);

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.order("created_at", { ascending: false }).range(from, to);

  const [{ data: products, count }, { data: categories }] = await Promise.all([
    query,
    supabase.from("categories").select("*").order("name"),
  ]);

  return (
    <AdminProductsListClient
      initialProducts={products ?? []}
      initialCount={count ?? 0}
      categories={categories ?? []}
      initialFilters={{ q: q ?? "", category: category ?? "", status: status ?? "", page, pageSize }}
    />
  );
}