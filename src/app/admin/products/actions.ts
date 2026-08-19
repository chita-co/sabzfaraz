"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deleteImageByUrl } from "@/lib/arvan";
import { buildProductCode } from "@/lib/sku";
import { generateUniqueSlug } from "@/lib/slug";

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
  isSoldByUnit?: boolean;
  unitLabel?: string | null;
  hasMinOrderQty?: boolean;
  minOrderQuantity?: number | null;
  images: string[];
  descriptionImages: string[];
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
    const { data: dup } = await supabase
      .from("products")
      .select("id")
      .eq("sku", sku)
      .maybeSingle();
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
  await supabase
    .from("product_quantity_tiers")
    .delete()
    .eq("product_id", productId);
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

async function logPriceHistory(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productId: string,
  price: number,
  discountPrice: number | null
) {
  await supabase.from("product_price_history").insert({
    product_id: productId,
    price,
    discount_price: discountPrice,
  });
}

export async function createProduct(input: ProductInput) {
  const supabase = await createClient();
  const slug = await generateUniqueSlug(supabase, input.slug || input.name);

  const { data: category } = await supabase
    .from("categories")
    .select("slug")
    .eq("id", input.categoryId)
    .single();
  const sku = await generateUniqueSku(
    supabase,
    category?.slug ?? "x",
    slug,
    input.price
  );

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
      is_sold_by_unit: input.isSoldByUnit,
      unit_label: input.unitLabel,
      has_min_order_quantity: input.hasMinOrderQty,
      min_order_quantity: input.minOrderQuantity,
      images: input.images,
      description_images: input.descriptionImages,
      colors: input.colors,
      sizes: input.sizes,
    })
    .select()
    .single();

  if (error || !created)
    return { error: "خطا: " + (error?.message ?? "") };

  await saveQuantityTiers(supabase, created.id, input.quantityTiers);
  await logPriceHistory(supabase, created.id, input.price, input.discountPrice);

  revalidatePath("/admin/products");
  revalidatePath("/");
  redirect("/admin/products");
}

export async function updateProduct(id: string, input: ProductInput) {
  const supabase = await createClient();
  const slug = await generateUniqueSlug(supabase, input.slug || input.name, id);

  const { data: before } = await supabase
    .from("products")
    .select("price, discount_price")
    .eq("id", id)
    .single();

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
      is_sold_by_unit: input.isSoldByUnit,
      unit_label: input.unitLabel,
      has_min_order_quantity: input.hasMinOrderQty,
      min_order_quantity: input.minOrderQuantity,
      images: input.images,
      description_images: input.descriptionImages,
      colors: input.colors,
      sizes: input.sizes,
    })
    .eq("id", id);

  if (error) return { error: "خطا: " + error.message };

  await saveQuantityTiers(supabase, id, input.quantityTiers);

  if (
    !before ||
    before.price !== input.price ||
    before.discount_price !== input.discountPrice
  ) {
    await logPriceHistory(supabase, id, input.price, input.discountPrice);
  }

  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath(`/products/${slug}`);
  redirect("/admin/products");
}

export async function deleteProduct(id: string, images: string[]) {
  const supabase = await createClient();
  const { data: current } = await supabase
    .from("products")
    .select("description_images")
    .eq("id", id)
    .single();
  for (const url of images) await deleteImageByUrl(url);
  for (const url of current?.description_images ?? [])
    await deleteImageByUrl(url);
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { error: "خطا در حذف محصول: " + error.message };
  revalidatePath("/admin/products");
  revalidatePath("/");
  return { success: true };
}

interface BulkVariantInput {
  name: string;
  nameEn: string | null;
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
  isSoldByUnit?: boolean; 
  unitLabel?: string | null;
  hasMinOrderQty: boolean;
  minOrderQuantity: number | null;
  images: string[];
  descriptionImages: string[];
  colors: { name: string; hex: string }[];
  sizes: string[];
  quantityTiers: QuantityTierInput[];
}

export async function createProductsBulk(
  base: BulkProductInput,
  variants: BulkVariantInput[]
) {
  const supabase = await createClient();
  const { data: category } = await supabase
    .from("categories")
    .select("slug")
    .eq("id", base.categoryId)
    .single();

  let successCount = 0;
  const failures: string[] = [];

  for (const variant of variants) {
    if (!variant.name.trim()) continue;
    try {
      const slug = await generateUniqueSlug(supabase, variant.name);
      const sku = await generateUniqueSku(
        supabase,
        category?.slug ?? "x",
        slug,
        base.price
      );

      const { data: created, error } = await supabase
        .from("products")
        .insert({
          name: variant.name,
          name_en: variant.nameEn,
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
          description_images: base.descriptionImages,
          colors: base.colors,
          sizes: base.sizes,
        })
        .select()
        .single();

      if (error || !created) {
        failures.push(`${variant.name}: ${error?.message ?? "خطای نامشخص"}`);
        continue;
      }

      await saveQuantityTiers(supabase, created.id, base.quantityTiers);
      await logPriceHistory(
        supabase,
        created.id,
        base.price,
        base.discountPrice
      );
      successCount++;
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "خطای نامشخص";
      failures.push(`${variant.name}: ${message}`);
    }
  }

  revalidatePath("/admin/products");
  revalidatePath("/");

  return { successCount, failures };
}

export async function copyProduct(id: string) {
  const supabase = await createClient();
  const { data: original } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();
  if (!original) return { error: "محصول یافت نشد." };

  const { data: category } = await supabase
    .from("categories")
    .select("slug")
    .eq("id", original.category_id)
    .single();
  const newName = `${original.name} (کپی)`;
  const slug = await generateUniqueSlug(supabase, newName);
  const sku = await generateUniqueSku(
    supabase,
    category?.slug ?? "x",
    slug,
    original.price
  );

  const { data: created, error } = await supabase
    .from("products")
    .insert({
      name: newName,
      name_en: original.name_en,
      slug,
      sku,
      description: original.description,
      price: original.price,
      discount_price: original.discount_price,
      stock: original.stock,
      brand: original.brand,
      category_id: original.category_id,
      is_active: false,
      is_deal: false,
      show_in_newest: original.show_in_newest,
      is_popular: false,
      is_stock: false,
      weight_grams: original.weight_grams,
      images: original.images,
      description_images: original.description_images,
      colors: original.colors,
      sizes: original.sizes,
    })
    .select()
    .single();

  if (error || !created)
    return { error: "خطا در کپی محصول: " + (error?.message ?? "") };

  const { data: tiers } = await supabase
    .from("product_quantity_tiers")
    .select("*")
    .eq("product_id", id);
  if (tiers && tiers.length > 0) {
    await supabase.from("product_quantity_tiers").insert(
      tiers.map((t) => ({
        product_id: created.id,
        min_qty: t.min_qty,
        max_qty: t.max_qty,
        unit_price: t.unit_price,
      }))
    );
  }

  revalidatePath("/admin/products");
  return { success: true, newId: created.id };
}

export async function quickUpdateProduct(
  id: string,
  changes: {
    price?: number;
    stock?: number | null;
    isActive?: boolean;
  }
) {
  const supabase = await createClient();
  const payload: Record<string, unknown> = {};
  if (changes.price !== undefined) payload.price = changes.price;
  if (changes.stock !== undefined) payload.stock = changes.stock;
  if (changes.isActive !== undefined) payload.is_active = changes.isActive;

  const { error } = await supabase.from("products").update(payload).eq("id", id);
  if (error) return { error: error.message };

  if (changes.price !== undefined) {
    const { data: p } = await supabase
      .from("products")
      .select("price, discount_price")
      .eq("id", id)
      .single();
    if (p) await logPriceHistory(supabase, id, p.price, p.discount_price);
  }

  revalidatePath("/admin/products");
  revalidatePath("/");
  return { success: true };
}

export async function getProductPriceHistory(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("product_price_history")
    .select("*")
    .eq("product_id", id)
    .order("changed_at", { ascending: false })
    .limit(20);
  return data ?? [];
}