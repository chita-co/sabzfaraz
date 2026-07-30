// src/app/admin/categories/page.tsx
import { createClient } from "@/lib/supabase/server";
import CategoryManager from "@/components/admin/CategoryManager";
import { Category } from "@/types";

export default async function AdminCategoriesPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("created_at", { ascending: false });

  return <CategoryManager categories={(categories as Category[]) ?? []} />;
}