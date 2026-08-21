import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProductForm from "@/components/admin/ProductForm";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: product }, { data: categories }, { data: tiers }, { data: extraCats }, { data: attrs }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).single(),
    supabase.from("categories").select("*").order("name"),
    supabase.from("product_quantity_tiers").select("*").eq("product_id", id).order("min_qty"),
    supabase.from("product_categories").select("category_id, is_primary").eq("product_id", id).eq("is_primary", false),
    supabase.from("product_attributes").select("id, attr_key, attr_value").eq("product_id", id).order("sort_order"),
  ]);

  if (!product) notFound();

  return (
    <ProductForm
      mode="edit"
      product={product}
      categories={categories ?? []}
      initialQuantityTiers={tiers ?? []}
      initialExtraCategoryIds={(extraCats ?? []).map((c) => c.category_id)}
      initialAttributes={(attrs ?? []).map((a) => ({ id: a.id, key: a.attr_key, value: a.attr_value }))}
    />
  );
}