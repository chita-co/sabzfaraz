// src/app/admin/products/actions.ts
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
  images: string[];
  colors: { name: string; hex: string }[];
  sizes: string[];
}

export async function createProduct(input: ProductInput) {
  const supabase = await createClient();
  const slug = slugify(input.slug || input.name);

  const { data: category } = await supabase
    .from("categories")
    .select("slug")
    .eq("id", input.categoryId)
    .single();

  const baseCode = buildProductCode(category?.slug ?? "x", slug, input.price);
  let sku = baseCode;
  let suffix = 2;
  while (true) {
    const { data: dup } = await supabase.from("products").select("id").eq("sku", sku).maybeSingle();
    if (!dup) break;
    sku = `${baseCode}-${suffix}`;
    suffix++;
  }

  const { error } = await supabase.from("products").insert({
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
    images: input.images,
    colors: input.colors,
    sizes: input.sizes,
  });

  if (error) {
    if (error.message.includes("duplicate")) {
      return { error: "این اسلاگ قبلاً استفاده شده است." };
    }
    return { error: "خطا: " + error.message };
  }

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
      images: input.images,
      colors: input.colors,
      sizes: input.sizes,
    })
    .eq("id", id);

  if (error) {
    return { error: "خطا: " + error.message };
  }

  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath(`/products/${slug}`);
  redirect("/admin/products");
}

export async function deleteProduct(id: string, images: string[]) {
  const supabase = await createClient();

  for (const url of images) {
    await deleteImageByUrl(url);
  }

  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    return { error: "خطا در حذف محصول: " + error.message };
  }

  revalidatePath("/admin/products");
  revalidatePath("/");
  return { success: true };
}