"use server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireActivePartner } from "@/lib/partners/auth";
import { getPartnerSettings } from "@/lib/partners/settings";
import { generateUniqueSlug } from "@/lib/slug";
import { revalidatePath } from "next/cache";

interface BulkRow {
  title: string; description: string; categoryName: string;
  sellPrice: number; partnerCostPrice: number; stock: number; stockUnlimited: boolean;
}

export async function bulkCreatePartnerProductsAction(rows: BulkRow[]) {
  const partner = await requireActivePartner();
  const settings = await getPartnerSettings();
  const admin = createAdminClient();

  const { data: allowedCategories } = await admin.from("partner_categories").select("categories(id, name)").eq("partner_id", partner.id);
  const categoryByName = new Map<string, string>();

  for (const row of allowedCategories ?? []) {
    const categories = (row as { categories: { name: string; id: string }[] }).categories;
    const category = Array.isArray(categories) ? categories[0] : categories;
    if (category?.id && category?.name) {
      categoryByName.set(category.name, category.id);
    }
  }

  const results: { row: number; title: string; success: boolean; error?: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    try {
      if (!r.title?.trim() || r.title.trim().length < 3) throw new Error("عنوان نامعتبر");
      const categoryId = categoryByName.get(r.categoryName?.trim());
      if (!categoryId) throw new Error(`دسته‌بندی «${r.categoryName}» برای شما مجاز نیست`);

      const profit = r.sellPrice - r.partnerCostPrice;
      const profitPercent = r.sellPrice > 0 ? (profit / r.sellPrice) * 100 : 0;
      if (profitPercent < settings.min_profit_percent) throw new Error("سود سایت کمتر از حد مجاز است");

      const slug = await generateUniqueSlug(admin, r.title);
      const { error } = await admin.from("products").insert({
        name: r.title.trim(), slug, description: r.description || "", category_id: categoryId,
        price: r.sellPrice, images: [], stock: r.stockUnlimited ? 999999 : r.stock,
        is_active: false, partner_id: partner.id, partner_cost_price: r.partnerCostPrice,
        partner_stock_unlimited: r.stockUnlimited, partner_approval_status: "PENDING_REVIEW",
      });
      if (error) throw new Error(error.message);

      results.push({ row: i + 1, title: r.title, success: true });
     } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "خطای نامشخص";
      results.push({ row: i + 1, title: r.title, success: false, error: message });
    }
  }

  revalidatePath("/partner/products");
  return { results };
}