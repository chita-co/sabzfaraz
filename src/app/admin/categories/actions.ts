// src/app/admin/categories/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { deleteImageByUrl } from "@/lib/arvan";

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function createCategory(formData: FormData) {
  const name = formData.get("name") as string;
  const rawSlug = formData.get("slug") as string;
  const description = formData.get("description") as string;
  const parentId = formData.get("parentId") as string;
  const image = formData.get("image") as string;

  const slug = slugify(rawSlug || name);
  if (!slug) return { error: "اسلاگ معتبر نیست. لطفاً یک اسلاگ انگلیسی وارد کنید." };

  const supabase = await createClient();
  const { error } = await supabase.from("categories").insert({
    name,
    slug,
    description: description || null,
    parent_id: parentId || null,
    image: image || null,
  });

  if (error) {
    if (error.message.includes("duplicate")) {
      return { error: "این اسلاگ قبلاً استفاده شده است." };
    }
    return { error: "خطا: " + error.message };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/");
  return { success: true };
}

export async function updateCategory(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const rawSlug = formData.get("slug") as string;
  const description = formData.get("description") as string;
  const parentId = formData.get("parentId") as string;
  const isActive = formData.get("isActive") === "on";
  const image = formData.get("image") as string;

  const slug = slugify(rawSlug || name);
  const supabase = await createClient();

  const { data: current } = await supabase
    .from("categories")
    .select("image")
    .eq("id", id)
    .single();

  if (current?.image && current.image !== image) {
    await deleteImageByUrl(current.image);
  }

  const { error } = await supabase
    .from("categories")
    .update({
      name,
      slug,
      description: description || null,
      parent_id: parentId || null,
      is_active: isActive,
      image: image || null,
    })
    .eq("id", id);

  if (error) return { error: "خطا: " + error.message };

  revalidatePath("/admin/categories");
  revalidatePath("/");
  return { success: true };
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();

  const { data: current } = await supabase
    .from("categories")
    .select("image")
    .eq("id", id)
    .single();

  if (current?.image) {
    await deleteImageByUrl(current.image);
  }

  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    if (error.message.includes("violates foreign key")) {
      return {
        error: "این دسته‌بندی دارای محصول است. ابتدا محصولات آن را حذف یا منتقل کنید.",
      };
    }
    return { error: "خطا: " + error.message };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/");
  return { success: true };
}