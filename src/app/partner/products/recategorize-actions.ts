// src/app/partner/products/recategorize-actions.ts
"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireActivePartner } from "@/lib/partners/auth";
import { notifyAllAdmins } from "@/lib/notifications";
import {
  suggestChains,
  type SuggestItem,
  type ChainSuggestion,
  type SuggestMode,
} from "@/lib/ai/categorySuggest";
import { applyCategoryChain, type ApplyLevel, type DbCat } from "@/lib/categories/applyCategoryChain";
import type { CatRow } from "@/lib/categoryTree";

// فقط محصولات خودِ همکار و فقط دسته‌های فعال که ادمین برای همکاران مجاز کرده
export async function suggestPartnerCategoriesAction(
  items: { productId: string; excludeKeys?: string[]; level?: number; prefix?: { categoryId: string | null; newName: string | null; newSlug: string | null }[] }[]
): Promise<{ error?: string; suggestions?: ChainSuggestion[] }> {
  try {
    const partner = await requireActivePartner();
    const ids = Array.from(new Set(items.map((i) => i.productId))).slice(0, 10);
    if (ids.length === 0) return { error: "محصولی انتخاب نشده است." };

    const admin = createAdminClient();
    const [{ data: prods }, { data: cats }] = await Promise.all([
      admin.from("products").select("id, name").eq("partner_id", partner.id).in("id", ids),
      admin
        .from("categories")
        .select("id, name, slug, parent_id")
        .eq("is_active", true)
        .eq("partner_allowed", true),
    ]);
    const nameById = new Map<string, string>((prods ?? []).map((p: { id: string; name: string }) => [p.id, p.name]));
    if (nameById.size === 0) return { error: "محصولی پیدا نشد." };

    const mode = Math.min(3, Math.max(0, Number(items[0]?.level ?? 0))) as SuggestMode;
    const list: SuggestItem[] = items
      .filter((i) => nameById.has(i.productId))
      .slice(0, mode === 0 ? 10 : 1)
      .map((i) => ({
        productId: i.productId,
        name: nameById.get(i.productId) ?? "",
        excludeKeys: i.excludeKeys?.slice(0, 30),
        prefix: i.prefix,
      }));

    const suggestions = await suggestChains(list, (cats ?? []) as CatRow[], mode, true);
    return { suggestions };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "خطا در دریافت پیشنهاد" };
  }
}

export async function applyPartnerRecategorizeAction(input: {
  productId: string;
  level: 1 | 2 | 3;
  levels: (ApplyLevel | null)[];
}): Promise<{ error?: string; success?: boolean; categoryId?: string; categoryName?: string; created?: DbCat[] }> {
  try {
    const partner = await requireActivePartner();
    const admin = createAdminClient();

    const { data: product } = await admin
      .from("products")
      .select("id, name, slug, partner_id, category_id")
      .eq("id", input.productId)
      .single();
    if (!product || product.partner_id !== partner.id) return { error: "دسترسی به این محصول ندارید." };

    const { data: cats } = await admin
      .from("categories")
      .select("id, name, slug, parent_id, is_active, partner_allowed");

    const result = await applyCategoryChain({
      admin,
      productId: product.id,
      productSlug: product.slug ?? null,
      currentCategoryId: product.category_id ?? null,
      levels: input.levels,
      level: input.level,
      partnerMode: true,
      allCats: (cats ?? []) as DbCat[],
    });

    if (result.created && result.created.length > 0) {
      try {
        await notifyAllAdmins(
          "دسته‌بندی جدید توسط همکار",
          `همکار برای محصول «${product.name}» دسته‌ی جدید ساخت: ${result.created.map((c) => c.name).join("، ")}`
        );
      } catch {
        /* اعلان اختیاری است */
      }
    }
    return result;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "خطای غیرمنتظره" };
  }
}