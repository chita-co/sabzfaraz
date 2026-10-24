// src/app/admin/categories/recategorize-actions.ts
"use server";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  suggestChains,
  type SuggestItem,
  type ChainSuggestion,
  type SuggestMode,
} from "@/lib/ai/categorySuggest";
import { applyCategoryChain, type ApplyLevel, type DbCat } from "@/lib/categories/applyCategoryChain";
import type { CatRow } from "@/lib/categoryTree";

const PAGE_SIZE = 30;

export interface RecategorizeProduct {
  id: string;
  name: string;
  image: string | null;
  category_id: string | null;
}

export async function listProductsForRecategorizeAction(input: {
  q?: string;
  page?: number;
}): Promise<{ error?: string; products?: RecategorizeProduct[]; total?: number; pageSize?: number }> {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const page = Math.max(1, Math.floor(input.page ?? 1));
    const from = (page - 1) * PAGE_SIZE;

    let query = admin.from("products").select("id, name, images, category_id", { count: "exact" });
    const q = (input.q ?? "").trim().slice(0, 100);
    if (q) query = query.ilike("name", `%${q}%`);

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (error) return { error: "خطا در دریافت محصولات: " + error.message };

    const products: RecategorizeProduct[] = (data ?? []).map(
      (p: { id: string; name: string; images: string[] | null; category_id: string | null }) => ({
        id: p.id,
        name: p.name,
        image: p.images?.[0] ?? null,
        category_id: p.category_id ?? null,
      })
    );
    return { products, total: count ?? 0, pageSize: PAGE_SIZE };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "خطای غیرمنتظره" };
  }
}

export async function suggestAdminCategoriesAction(
  items: { productId: string; excludeKeys?: string[]; level?: number; prefix?: { categoryId: string | null; newName: string | null; newSlug: string | null }[] }[]
): Promise<{ error?: string; suggestions?: ChainSuggestion[] }> {
  try {
    await requireAdmin();
    const ids = Array.from(new Set(items.map((i) => i.productId))).slice(0, 10);
    if (ids.length === 0) return { error: "محصولی انتخاب نشده است." };

    const admin = createAdminClient();
    const [{ data: prods }, { data: cats }] = await Promise.all([
      admin.from("products").select("id, name").in("id", ids),
      admin.from("categories").select("id, name, slug, parent_id").eq("is_active", true),
    ]);
    const nameById = new Map<string, string>((prods ?? []).map((p: { id: string; name: string }) => [p.id, p.name]));

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

export async function applyAdminRecategorizeAction(input: {
  productId: string;
  level: 1 | 2 | 3;
  levels: (ApplyLevel | null)[];
}): Promise<{ error?: string; success?: boolean; categoryId?: string; categoryName?: string; created?: DbCat[] }> {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const { data: product } = await admin
      .from("products")
      .select("id, name, slug, category_id")
      .eq("id", input.productId)
      .single();
    if (!product) return { error: "محصول پیدا نشد." };

    const { data: cats } = await admin
      .from("categories")
      .select("id, name, slug, parent_id, is_active, partner_allowed");

    return await applyCategoryChain({
      admin,
      productId: product.id,
      productSlug: product.slug ?? null,
      currentCategoryId: product.category_id ?? null,
      levels: input.levels,
      level: input.level,
      partnerMode: false,
      allCats: (cats ?? []) as DbCat[],
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "خطای غیرمنتظره" };
  }
}