// src/lib/categories/applyCategoryChain.ts
import { revalidatePath, updateTag } from "next/cache";
import { normalizeName, cleanSlug } from "@/lib/ai/categorySuggest";
import type { createAdminClient } from "@/lib/supabase/admin";

type Admin = ReturnType<typeof createAdminClient>;

export interface ApplyLevel {
  categoryId: string | null;
  newName: string | null;
  newSlug: string | null;
}

export interface DbCat {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  is_active: boolean;
  partner_allowed: boolean;
}

// فقط سطح‌های 1 تا level را اعمال می‌کند؛ اگر لازم باشد، دسته‌ی جدید می‌سازد
export async function applyCategoryChain(opts: {
  admin: Admin;
  productId: string;
  productSlug: string | null;
  currentCategoryId: string | null;
  levels: (ApplyLevel | null)[];
  level: 1 | 2 | 3;
  partnerMode: boolean;
  allCats: DbCat[];
}): Promise<{ error?: string; success?: boolean; categoryId?: string; categoryName?: string; created?: DbCat[] }> {
  const cats = [...opts.allCats];
  const byId = new Map(cats.map((c) => [c.id, c]));
  const slugs = new Set(cats.map((c) => c.slug));
  const created: DbCat[] = [];
  let parent: string | null = null;

  for (let i = 0; i < opts.level; i++) {
    const slot = opts.levels[i];
    if (!slot) return { error: `برای سطح ${i + 1} پیشنهادی وجود ندارد.` };

    if (slot.categoryId) {
      const c = byId.get(slot.categoryId);
      if (!c || !c.is_active || (opts.partnerMode && !c.partner_allowed)) {
        return { error: "یکی از دسته‌بندی‌های پیشنهادی معتبر یا مجاز نیست." };
      }
      if ((c.parent_id ?? null) !== parent) {
        return { error: "ترتیب دسته‌بندی‌های پیشنهادی نامعتبر است." };
      }
      parent = c.id;
      continue;
    }

    if (!slot.newName) return { error: "پیشنهاد نامعتبر است." };
    const name = slot.newName.trim().slice(0, 80);
    const norm = normalizeName(name);
    const same = cats.find((c) => (c.parent_id ?? null) === parent && normalizeName(c.name) === norm);
    if (same) {
      parent = same.id;
      continue;
    }

    const base =
      cleanSlug(slot.newSlug ?? "") || cleanSlug(name) || `category-${Date.now().toString(36)}`;
    let slug = base;
    let n = 2;
    while (slugs.has(slug)) slug = `${base}-${n++}`;
    slugs.add(slug);

    const { data, error } = await opts.admin
      .from("categories")
      .insert({ name, slug, parent_id: parent, is_active: true, partner_allowed: true })
      .select("id, name, slug, parent_id, is_active, partner_allowed")
      .single();
    if (error || !data) return { error: "خطا در ساخت دسته‌ی جدید." };

    const row = data as DbCat;
    created.push(row);
    cats.push(row);
    byId.set(row.id, row);
    parent = row.id;
  }

  const targetId = parent as string | null;
  if (!targetId) return { error: "دسته‌بندی مقصد مشخص نیست." };
  const targetName = byId.get(targetId)?.name ?? "";

  if (targetId === opts.currentCategoryId) {
    return { success: true, categoryId: targetId, categoryName: targetName, created };
  }

  const { error: upErr } = await opts.admin
    .from("products")
    .update({ category_id: targetId })
    .eq("id", opts.productId);
  if (upErr) return { error: "خطا در تغییر دسته‌بندی." };

  await opts.admin
    .from("product_categories")
    .delete()
    .eq("product_id", opts.productId)
    .or(`is_primary.eq.true,category_id.eq.${targetId}`);
  await opts.admin
    .from("product_categories")
    .insert({ product_id: opts.productId, category_id: targetId, is_primary: true });

  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/admin/partners/products");
  revalidatePath("/partner/products");
  revalidatePath("/");
  updateTag("products");
  if (created.length) updateTag("categories");
  if (opts.productSlug) revalidatePath(`/products/${opts.productSlug}`);

  return { success: true, categoryId: targetId, categoryName: targetName, created };
}