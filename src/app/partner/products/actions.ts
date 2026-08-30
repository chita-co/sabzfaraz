"use server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireActivePartner } from "@/lib/partners/auth";
import { getPartnerSettings } from "@/lib/partners/settings";
import { callAiWithRotation } from "@/lib/ai/rotatingClient";
import { generateUniqueSlug } from "@/lib/slug";
import { uploadImage } from "@/lib/arvan";
import { notifyAllAdmins } from "@/lib/notifications";
import { revalidatePath } from "next/cache";
import sharp from "sharp";

export async function uploadPartnerLogoAction(formData: FormData) {
  const file = formData.get("file") as File | null;
  if (!file) return { error: "فایلی انتخاب نشده" };
  const buffer = Buffer.from(await file.arrayBuffer());
  const webp = await sharp(buffer).resize(300, 300, { fit: "cover" }).webp({ quality: 85 }).toBuffer();
  const url = await uploadImage(webp, `partners/logos/${Date.now()}.webp`);
  return { url };
}

export async function uploadPartnerProductImageAction(formData: FormData) {
  await requireActivePartner();
  const file = formData.get("file") as File | null;
  if (!file) return { error: "فایلی انتخاب نشده" };
  const buffer = Buffer.from(await file.arrayBuffer());
  const webp = await sharp(buffer).webp({ quality: 90 }).toBuffer();
  const url = await uploadImage(webp, `partners/products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`);
  return { url };
}

export async function autofillProductWithAiAction(title: string) {
  const partner = await requireActivePartner();
  if (!title || title.trim().length < 3) return { error: "ابتدا عنوان محصول را با جزئیات کافی وارد کنید." };

  const settings = await getPartnerSettings();
  const admin = createAdminClient();

  const aiDailyRequestLimit = (partner as { ai_daily_request_limit?: number }).ai_daily_request_limit;
  if (aiDailyRequestLimit) {
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    // شمارش ساده بر اساس محصولات ai_autofilled امروز این همکار (بدون نیاز به جدول جدید)
    const { count } = await admin.from("products").select("id", { count: "exact", head: true })
      .eq("partner_id", partner.id).eq("ai_autofilled", true).gte("created_at", startOfDay.toISOString());
    if ((count ?? 0) >= aiDailyRequestLimit) {
      return { error: "سقف روزانه‌ی استفاده از پرکردن خودکار برای شما به پایان رسیده است." };
    }
  }

  const { data: categories } = await admin.from("categories").select("name").eq("partner_allowed", true).eq("is_active", true);
  const categoryNames = (categories ?? []).map((c) => c.name);

  const prompt = `
${settings.ai_default_prompt}

عنوان محصول: ${title}
دسته‌بندی‌های موجود: ${categoryNames.join("، ") || "نامشخص"}

فقط یک JSON با این ساختار دقیق برگردان (بدون Markdown fence):
{
  "short_description": "خلاصه یک‌خطی جذاب",
  "description": "توضیح کامل HTML ساده (h3, p, ul, li) شامل ویژگی‌ها، کاربردها و مشخصات فنی",
  "tags": ["برچسب۱", "برچسب۲"],
  "suggested_category": "نزدیک‌ترین نام از لیست دسته‌بندی‌های موجود، یا null"
}`.trim();

  try {
    const raw = await callAiWithRotation(prompt, settings.ai_rotation_mode);
    const parsed = JSON.parse(raw);
    return { success: true, ...parsed };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "مشکلی پیش آمده، لطفاً دوباره تلاش کنید.";
    return { error: message };
  }
}

interface PartnerProductInput {
  title: string;
  description: string;
  shortDescription: string;
  categoryId: string;
  sellPrice: number;
  partnerCostPrice: number;
  stock: number;
  stockUnlimited: boolean;
  images: string[];
  imageSources: { finalUrl: string; rawCropUrl: string }[];
  tags: string[];
  aiAutofilled: boolean;
}

export async function createPartnerProductAction(input: PartnerProductInput) {
  const partner = await requireActivePartner();
  const settings = await getPartnerSettings();
  const admin = createAdminClient();

  if (!input.title.trim() || input.title.trim().length < 3) return { error: "عنوان محصول باید حداقل ۳ کاراکتر باشد." };
  if (!input.categoryId) return { error: "دسته‌بندی را انتخاب کنید." };
  if (input.images.length === 0) return { error: "حداقل یک تصویر محصول لازم است." };
  if (!input.stockUnlimited && input.stock < settings.min_allowed_stock) {
    return { error: "موجودی واردشده معتبر نیست." };
  }

  const profit = input.sellPrice - input.partnerCostPrice;
  const profitPercent = input.sellPrice > 0 ? (profit / input.sellPrice) * 100 : 0;
  if (profitPercent < settings.min_profit_percent) {
    return { error: "سود سایت برای این محصول کمتر از حد مجاز است. لطفاً قیمت فروش را افزایش دهید یا مبلغ دریافتی خود را کاهش دهید." };
  }

  const { data: categoryCheck } = await admin.from("categories").select("id").eq("id", input.categoryId).eq("partner_allowed", true).maybeSingle();
  if (!categoryCheck) return { error: "این دسته‌بندی برای همکاران مجاز نیست." };

  const slug = await generateUniqueSlug(admin, input.title);

  const { data: product, error } = await admin.from("products").insert({
    name: input.title.trim(),
    slug,
    description: input.description,
    short_description: input.shortDescription || null,
    category_id: input.categoryId,
    price: input.sellPrice,
    images: input.images,
    tags: input.tags,
    stock: input.stockUnlimited ? 999999 : input.stock,
    is_active: false,
    partner_id: partner.id,
    partner_cost_price: input.partnerCostPrice,
    partner_stock_unlimited: input.stockUnlimited,
    partner_approval_status: "PENDING_REVIEW",
    ai_autofilled: input.aiAutofilled,
  }).select("id").single();

  if (error || !product) return { error: "خطا در ثبت محصول: " + error?.message };

  if (input.imageSources.length > 0) {
    await admin.from("partner_product_image_sources").insert(
      input.imageSources.map((s) => ({ product_id: product.id, final_image_url: s.finalUrl, raw_crop_url: s.rawCropUrl }))
    );
  }

  try {
    await notifyAllAdmins("محصول جدید همکار در انتظار بررسی 📦", `«${partner.business_name}» محصول «${input.title}» را ثبت کرد.`);
  } catch (e) { console.error(e); }

  revalidatePath("/partner/products");
  return { success: true, productId: product.id };
}

export async function updatePartnerProductAction(productId: string, input: Partial<PartnerProductInput>) {
  const partner = await requireActivePartner();
  const admin = createAdminClient();

  const { data: existing } = await admin.from("products").select("*").eq("id", productId).eq("partner_id", partner.id).single();
  if (!existing) return { error: "محصول یافت نشد یا متعلق به شما نیست." };

  const settings = await getPartnerSettings();

  const payload: Record<string, unknown> = {};
  if (input.title !== undefined) payload.name = input.title.trim();
  if (input.description !== undefined) payload.description = input.description;
  if (input.shortDescription !== undefined) payload.short_description = input.shortDescription || null;
  if (input.images !== undefined) payload.images = input.images;
  if (input.tags !== undefined) payload.tags = input.tags;

  // موجودی: مطابق مشخصات، بدون نیاز به تأیید مجدد ولی ثبت در لاگ محصول (فیلد ai_autofilled بدون تغییر باقی می‌مونه)
  if (input.stock !== undefined || input.stockUnlimited !== undefined) {
    const unlimited = input.stockUnlimited ?? existing.partner_stock_unlimited;
    payload.stock = unlimited ? 999999 : (input.stock ?? existing.stock);
    payload.partner_stock_unlimited = unlimited;
    if (payload.stock === 0) payload.is_active = false;
  }

  // قیمت: تغییر مهم — نیاز به تأیید مجدد مدیر
  if (input.sellPrice !== undefined || input.partnerCostPrice !== undefined) {
    const newSell = input.sellPrice ?? existing.price;
    const newCost = input.partnerCostPrice ?? existing.partner_cost_price;
    const profitPercent = newSell > 0 ? ((newSell - newCost) / newSell) * 100 : 0;
    if (profitPercent < settings.min_profit_percent) {
      return { error: "سود سایت برای این محصول کمتر از حد مجاز است." };
    }
    payload.price = newSell;
    payload.partner_cost_price = newCost;
    payload.partner_approval_status = "PENDING_REVIEW";
    payload.is_active = false;
  }

  const { error } = await admin.from("products").update(payload).eq("id", productId);
  if (error) return { error: error.message };

  revalidatePath("/partner/products");
  return { success: true };
}

export async function getMyAllowedCategoriesAction() {
  const partner = await requireActivePartner();
  const admin = createAdminClient();
  const { data } = await admin
    .from("partner_categories")
    .select("categories(id, name)")
    .eq("partner_id", partner.id);
  return (data ?? []).map((r: { categories: unknown }) => r.categories).filter(Boolean);
}