// src/app/admin/products/page.tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Plus } from "lucide-react";
import ProductsTable from "@/components/admin/ProductsTable";

export default async function AdminProductsPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("*, category:categories(name)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">مدیریت محصولات</h1>
        <Link
          href="/admin/products/new"
          className="admin-btn admin-btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          محصول جدید
        </Link>
      </div>

      <ProductsTable products={products ?? []} />
    </div>
  );
}