"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deleteImageByUrl } from "@/lib/arvan";
import { buildProductCode } from "@/lib/sku";

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

interface QuantityTierInput {
  minQty: number;
  maxQty: number;
  unitPrice: number;
}

interface ProductInput {
  name: string;
  nameEn: string | null;
  slug: string;
  description: string;
  price: number;
  discountPrice: number | null;
  stock: number | null;
  brand: string | null;
  categoryId: string;
  isActive: boolean;
  isDeal: boolean;
  showInNewest: boolean;
  isPopular: boolean;
  isStock: boolean;
  weightGrams: number | null;
  images: string[];
  colors: { name: string; hex: string }[];
  sizes: string[];
  quantityTiers: QuantityTierInput[];
}

async function generateUniqueSku(
  supabase: Awaited<ReturnType<typeof createClient>>,
  categorySlug: string,
  productSlug: string,
  price: number
) {
  const baseCode = buildProductCode(categorySlug, productSlug, price);
  let sku = baseCode;
  let suffix = 2;
  while (true) {
    const { data: dup } = await supabase.from("products").select("id").eq("sku", sku).maybeSingle();
    if (!dup) break;
    sku = `${baseCode}-${suffix}`;
    suffix++;
  }
  return sku;
}

async function saveQuantityTiers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productId: string,
  tiers: QuantityTierInput[]
) {
  await supabase.from("product_quantity_tiers").delete().eq("product_id", productId);
  if (tiers.length > 0) {
    await supabase.from("product_quantity_tiers").insert(
      tiers.map((t) => ({
        product_id: productId,
        min_qty: t.minQty,
        max_qty: t.maxQty,
        unit_price: t.unitPrice,
      }))
    );
  }
}

export async function createProduct(input: ProductInput) {
  const supabase = await createClient();
  const slug = slugify(input.slug || input.name);

  const { data: category } = await supabase.from("categories").select("slug").eq("id", input.categoryId).single();
  const sku = await generateUniqueSku(supabase, category?.slug ?? "x", slug, input.price);

  const { data: created, error } = await supabase
    .from("products")
    .insert({
      name: input.name,
      name_en: input.nameEn,
      slug,
      sku,
      description: input.description,
      price: input.price,
      discount_price: input.discountPrice,
      stock: input.stock,
      brand: input.brand,
      category_id: input.categoryId,
      is_active: input.isActive,
      is_deal: input.isDeal,
      show_in_newest: input.showInNewest,
      is_popular: input.isPopular,
      is_stock: input.isStock,
      weight_grams: input.weightGrams,
      images: input.images,
      colors: input.colors,
      sizes: input.sizes,
    })
    .select()
    .single();

  if (error || !created) {
    if (error?.message.includes("duplicate")) return { error: "این اسلاگ قبلاً استفاده شده است." };
    return { error: "خطا: " + (error?.message ?? "") };
  }

  await saveQuantityTiers(supabase, created.id, input.quantityTiers);

  revalidatePath("/admin/products");
  revalidatePath("/");
  redirect("/admin/products");
}

export async function updateProduct(id: string, input: ProductInput) {
  const supabase = await createClient();
  const slug = slugify(input.slug || input.name);

  const { error } = await supabase
    .from("products")
    .update({
      name: input.name,
      name_en: input.nameEn,
      slug,
      description: input.description,
      price: input.price,
      discount_price: input.discountPrice,
      stock: input.stock,
      brand: input.brand,
      category_id: input.categoryId,
      is_active: input.isActive,
      is_deal: input.isDeal,
      show_in_newest: input.showInNewest,
      is_popular: input.isPopular,
      is_stock: input.isStock,
      weight_grams: input.weightGrams,
      images: input.images,
      colors: input.colors,
      sizes: input.sizes,
    })
    .eq("id", id);

  if (error) return { error: "خطا: " + error.message };

  await saveQuantityTiers(supabase, id, input.quantityTiers);

  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath(`/products/${slug}`);
  redirect("/admin/products");
}

export async function deleteProduct(id: string, images: string[]) {
  const supabase = await createClient();
  for (const url of images) await deleteImageByUrl(url);
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { error: "خطا در حذف محصول: " + error.message };
  revalidatePath("/admin/products");
  revalidatePath("/");
  return { success: true };
}

interface BulkVariantInput {
  name: string;
  stock: number | null;
}

interface BulkProductInput {
  description: string;
  price: number;
  discountPrice: number | null;
  brand: string | null;
  categoryId: string;
  isActive: boolean;
  isDeal: boolean;
  showInNewest: boolean;
  isPopular: boolean;
  isStock: boolean;
  weightGrams: number | null;
  images: string[];
  colors: { name: string; hex: string }[];
  sizes: string[];
}

export async function createProductsBulk(base: BulkProductInput, variants: BulkVariantInput[]) {
  const supabase = await createClient();

  const { data: category } = await supabase.from("categories").select("slug").eq("id", base.categoryId).single();

  for (const variant of variants) {
    if (!variant.name.trim()) continue;
    const slug = slugify(variant.name);
    const sku = await generateUniqueSku(supabase, category?.slug ?? "x", slug, base.price);

    const { error } = await supabase.from("products").insert({
      name: variant.name,
      name_en: null,
      slug,
      sku,
      description: base.description,
      price: base.price,
      discount_price: base.discountPrice,
      stock: variant.stock,
      brand: base.brand,
      category_id: base.categoryId,
      is_active: base.isActive,
      is_deal: base.isDeal,
      show_in_newest: base.showInNewest,
      is_popular: base.isPopular,
      is_stock: base.isStock,
      weight_grams: base.weightGrams,
      images: base.images,
      colors: base.colors,
      sizes: base.sizes,
    });

    if (error) {
      return { error: `خطا در ساخت محصول «${variant.name}»: ${error.message}` };
    }
  }

  revalidatePath("/admin/products");
  revalidatePath("/");
  redirect("/admin/products");
}