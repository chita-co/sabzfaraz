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
  try {
    const file = formData.get("file") as File | null;
    if (!file) return { error: "فایلی انتخاب نشده" };
    const buffer = Buffer.from(await file.arrayBuffer());
    const webp = await sharp(buffer).resize(300, 300, { fit: "cover" }).webp({ quality: 85 }).toBuffer();
    const url = await uploadImage(webp, `partners/logos/${Date.now()}.webp`);
    return { url };
  } catch (e: unknown) {
  const message = e instanceof Error ? e.message : "خطا در آپلود لوگو";
  return { error: message };
}
}

export async function uploadPartnerProductImageAction(formData: FormData) {
  try {
    await requireActivePartner();
    const file = formData.get("file") as File | null;
    if (!file) return { error: "فایلی انتخاب نشده" };
    const buffer = Buffer.from(await file.arrayBuffer());
    const webp = await sharp(buffer).webp({ quality: 90 }).toBuffer();
    const url = await uploadImage(webp, `partners/products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`);
    return { url };
   } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "خطا در آپلود تصویر";
    return { error: message };
  }
}

export async function autofillProductWithAiAction(title: string) {
  try {
    const partner = await requireActivePartner();
    if (!title || title.trim().length < 3) return { error: "ابتدا عنوان محصول را با جزئیات کافی وارد کنید." };

    const settings = await getPartnerSettings();
    const admin = createAdminClient();

    if (partner.ai_daily_request_limit) {
      const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
      const { count } = await admin.from("products").select("id", { count: "exact", head: true })
        .eq("partner_id", partner.id).eq("ai_autofilled", true).gte("created_at", startOfDay.toISOString());
      if ((count ?? 0) >= partner.ai_daily_request_limit) {
        return { error: "سقف روزانه‌ی استفاده از پرکردن خودکار برای شما به پایان رسیده است." };
      }
    }

    const { data: allowedCategories } = await admin.from("categories")
  .select("name")
  .eq("partner_allowed", true)
  .eq("is_active", true);
const categoryNames = (allowedCategories ?? []).map((c: { name: string }) => c.name).filter(Boolean);

    const prompt = `
${settings.ai_default_prompt}

عنوان واردشده توسط همکار: ${title}
دسته‌بندی‌های مجاز: ${categoryNames.join("، ") || "نامشخص"}

تو یک کارشناس حرفه‌ای تولید محتوای فروشگاهی فارسی برای سبزفراز (فروشگاه اینترنتی لوازم الکترونیک) هستی. بر اساس عنوان محصول، اطلاعات زیر را کامل، دقیق و حرفه‌ای تولید کن. اگر عنوان ناقص یا نادرست است، «title» را کامل و صحیح برگردان. قیمت محصول را همکار به‌صورت دستی وارد می‌کند، پس هیچ فیلد قیمتی برنگردان.

قوانین سخت‌گیرانه برای فیلد description (خیلی مهم):
- خروجی باید HTML کاملاً معتبر و تمیز باشد. هیچ خط جداکننده با علامت خط تیره (مثل -----)، هیچ pipe (|)، و هیچ کاراکتر یا متنی خارج از یک تگ HTML مجاز نیست.
- دقیقاً همین ساختار را رعایت کن:
  <p>یک یا دو پاراگراف مقدمه‌ی طبیعی و جذاب درباره‌ی محصول؛ اگر محصول با چند اسم رایج در بازار شناخته می‌شود (مثلاً وارنیش حرارتی = شیرینگ حرارتی = هیت‌شرینک)، همه‌ی این نام‌ها را طبیعی داخل متن بیاور.</p>
  <h3>مشخصات فنی</h3><ul><li>...</li><li>...</li></ul>
  <h3>کاربردهای رایج</h3><ul><li>...</li><li>...</li></ul>
  <h3>نکات مهم و نحوه استفاده</h3><ul><li>...</li><li>...</li></ul>
  <h3>محتویات بسته</h3><ul><li>...</li></ul>
  <h3>سوالات متداول</h3> حداقل ۳ سؤال، هرکدام به شکل: <p><strong>سؤال؟</strong><br>پاسخ کوتاه و مفید.</p>
  <p>یک پاراگراف کوتاه و طبیعی معرفی فروشگاه سبزفراز، متناسب با دسته‌ی همین محصول (بدون pipe و بدون علامت تزئینی)، شامل sabzfaraz.ir به‌صورت متن عادی داخل جمله.</p>
- از نقطه‌گذاری صحیح و کامل فارسی (نقطه، ویرگول، دونقطه) استفاده کن. جمله‌ها روان، کامل و حرفه‌ای باشند — دقیقاً مثل توضیح محصول در بهترین فروشگاه‌های اینترنتی ایران.
- هیچ‌کدام از بخش‌های بالا را حذف نکن مگر واقعاً برای آن محصول خاص بی‌معنی باشد.
- طول توضیحات باید کامل و غنی باشد (حداقل ۳۰۰ کلمه)، نه سطحی و کوتاه.

فقط یک JSON با این ساختار دقیق برگردان (بدون Markdown fence، بدون توضیح اضافه):
{
  "title": "نام کامل و اصلاح‌شده فارسی محصول",
  "name_en": "نام انگلیسی دقیق و استاندارد",
  "brand": "برند محصول یا null اگر مشخص نیست",
  "weight_grams": عدد تقریبی وزن هر واحد به گرم،
  "description": "متن HTML طبق قوانین دقیق بالا",
  "short_description": "خلاصه یک یا دو جمله‌ی جذاب برای لیست محصولات",
  "tags": ["برچسب۱", "برچسب۲", "برچسب۳"],
  "meta_title": "عنوان سئو (حداکثر ۶۰ کاراکتر)",
  "meta_description": "توضیح متا (حداکثر ۱۶۰ کاراکتر)",
  "focus_keyword": "کلمه کلیدی اصلی",
  "suggested_category": "نزدیک‌ترین نام از دسته‌بندی‌های مجاز بالا، یا null",
  "colors": [{"name":"نقره‌ای","hex":"#c0c0c0"}],
  "sizes": ["0.8mm"],
  "attributes": [{"key":"نوع محصول","value":"..."},{"key":"قطر","value":"..."}],
  "is_sold_by_unit": true یا false,
  "unit_label": "متر" یا "کیلوگرم" یا null,
  "has_min_order_quantity": true یا false,
  "min_order_quantity": عدد یا null
}`.trim();

    const raw = await callAiWithRotation(prompt, settings.ai_rotation_mode);
    const parsed = JSON.parse(raw);
    return { success: true, ...parsed };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "مشکلی پیش آمده، لطفاً دوباره تلاش کنید.";
    return { error: message };
  }
}

interface PartnerProductInput {
  title: string; nameEn: string | null; description: string; shortDescription: string | null; tags: string[];
  categoryId: string | null; extraCategoryIds: string[]; suggestedCategoryName: string | null;
  sellPrice: number; discountSellPrice: number | null; partnerCostPrice: number;
  stock: number; stockUnlimited: boolean; brand: string | null; weightGrams: number | null;
  isSoldByUnit: boolean; unitLabel: string | null; hasMinOrderQty: boolean; minOrderQuantity: number | null;
  quantityTiers: { minQty: number; maxQty: number; unitPrice: number }[];
  metaTitle: string | null; metaDescription: string | null; focusKeyword: string | null;
  colors: { name: string; hex: string }[]; sizes: string[];
  attributes: { key: string; value: string }[];
  showInNewest: boolean; isPopular: boolean; isStock: boolean; showInFeed: boolean; reviewsEnabled: boolean;
  displayPriority: number; maxPurchaseQty: number | null;
  packageLengthCm: number | null; packageWidthCm: number | null; packageHeightCm: number | null;
  gtin: string | null; modelVersion: string | null;
  fulfillmentType: "INSTANT" | "CHINA_ORDER" | "BOTH";
  chinaPrice: number | null; chinaDeliveryMin: number | null; chinaDeliveryMax: number | null;
  chinaDeliveryUnit: "day" | "week" | "month"; chinaTermsText: string | null; chinaDeliveryText: string | null; chinaOrderNote: string | null;
  images: string[]; imageAltTexts: string[]; imageSources: { finalUrl: string; rawCropUrl: string }[];
  aiAutofilled: boolean;
}

async function savePartnerProductCategories(
  admin: ReturnType<typeof createAdminClient>,
  productId: string,
  primaryCategoryId: string,
  extraCategoryIds: string[]
) {
  // حذف تمام دسته‌های قبلی محصول
  await admin.from("product_categories").delete().eq("product_id", productId);

  // ساخت ردیف‌ها شامل دسته‌ی اصلی و فرعی
  const rows = [
    { product_id: productId, category_id: primaryCategoryId, is_primary: true },
    ...extraCategoryIds
      .filter((id) => id !== primaryCategoryId)
      .map((id) => ({ product_id: productId, category_id: id, is_primary: false })),
  ];

  if (rows.length > 0) {
    await admin.from("product_categories").insert(rows);
  }
}

export async function createPartnerProductAction(input: PartnerProductInput) {
  try {
    const partner = await requireActivePartner();
    const settings = await getPartnerSettings();
    const admin = createAdminClient();

    if (!input.title.trim() || input.title.trim().length < 3) return { error: "عنوان محصول باید حداقل ۳ کاراکتر باشد." };
    if (!input.categoryId && !input.suggestedCategoryName) return { error: "دسته‌بندی را انتخاب یا پیشنهاد دهید." };
    if (input.images.length === 0) return { error: "حداقل یک تصویر محصول لازم است." };

    if (partner.max_active_products) {
      const { count } = await admin.from("products").select("id", { count: "exact", head: true }).eq("partner_id", partner.id).eq("partner_approval_status", "APPROVED");
      if ((count ?? 0) >= partner.max_active_products) return { error: `شما به سقف مجاز ${partner.max_active_products} محصول فعال رسیده‌اید.` };
    }

    const profit = input.sellPrice - input.partnerCostPrice;
    const profitPercent = input.sellPrice > 0 ? (profit / input.sellPrice) * 100 : 0;
    if (profitPercent < settings.min_profit_percent) {
      return { error: "سود سایت برای این محصول کمتر از حد مجاز است. لطفاً قیمت فروش را افزایش دهید یا مبلغ دریافتی خود را کاهش دهید." };
    }

    let categoryId = input.categoryId;
    if (!categoryId) {
      const { data: fallback } = await admin.from("categories")
        .select("id")
        .eq("partner_allowed", true)
        .eq("is_active", true)
        .order("created_at")
        .limit(1)
        .maybeSingle();
      categoryId = fallback?.id ?? null;
      if (!categoryId) return { error: "خطای داخلی: دسته‌بندی پیش‌فرض یافت نشد." };
    }
    if (categoryId) {
      const { data: categoryCheck } = await admin.from("categories")
        .select("id")
        .eq("id", categoryId)
        .eq("partner_allowed", true)
        .eq("is_active", true)
        .maybeSingle();
      if (!categoryCheck) return { error: "این دسته‌بندی برای همکاران مجاز نیست." };
    }


    const slug = await generateUniqueSlug(admin, input.title);

    const { data: product, error } = await admin.from("products").insert({
      name: input.title.trim(), name_en: input.nameEn, slug,
      description: input.description, short_description: input.shortDescription,
      category_id: categoryId, price: input.sellPrice, discount_price: input.discountSellPrice,
      images: input.images, image_alt_texts: input.imageAltTexts, tags: input.tags,
      stock: input.stockUnlimited ? 999999 : input.stock, is_active: false,
      brand: input.brand, weight_grams: input.weightGrams,
      is_sold_by_unit: input.isSoldByUnit, unit_label: input.unitLabel,
      has_min_order_quantity: input.hasMinOrderQty, min_order_quantity: input.minOrderQuantity,
      meta_title: input.metaTitle, meta_description: input.metaDescription, focus_keyword: input.focusKeyword,
      colors: input.colors, sizes: input.sizes,
      show_in_newest: input.showInNewest, is_popular: input.isPopular, is_stock: input.isStock,
      show_in_feed: input.showInFeed, reviews_enabled: input.reviewsEnabled,
      display_priority: input.displayPriority, max_purchase_qty: input.maxPurchaseQty,
      package_length_cm: input.packageLengthCm, package_width_cm: input.packageWidthCm, package_height_cm: input.packageHeightCm,
      gtin: input.gtin, model_version: input.modelVersion,
      fulfillment_type: input.fulfillmentType, china_price: input.chinaPrice,
      china_delivery_min: input.chinaDeliveryMin, china_delivery_max: input.chinaDeliveryMax, china_delivery_unit: input.chinaDeliveryUnit,
      china_terms_text: input.chinaTermsText, china_delivery_text: input.chinaDeliveryText, china_order_note: input.chinaOrderNote,
      partner_id: partner.id, partner_cost_price: input.partnerCostPrice,
      partner_stock_unlimited: input.stockUnlimited, partner_approval_status: "PENDING_REVIEW",
      ai_autofilled: input.aiAutofilled,
    }).select("id").single();

    if (error || !product) return { error: "خطا در ثبت محصول: " + (error?.message ?? "نامشخص") };

    await savePartnerProductCategories(admin, product.id, categoryId, input.extraCategoryIds);

    if (input.quantityTiers.length > 0) {
      await admin.from("product_quantity_tiers").insert(input.quantityTiers.map((t) => ({ product_id: product.id, min_qty: t.minQty, max_qty: t.maxQty, unit_price: t.unitPrice })));
    }
    if (input.attributes.length > 0) {
      await admin.from("product_attributes").insert(input.attributes.map((a, i) => ({ product_id: product.id, attr_key: a.key, attr_value: a.value, sort_order: i })));
    }
    if (input.imageSources.length > 0) {
      await admin.from("partner_product_image_sources").insert(input.imageSources.map((s) => ({ product_id: product.id, final_image_url: s.finalUrl, raw_crop_url: s.rawCropUrl })));
    }
    if (input.suggestedCategoryName) {
      await admin.from("partner_category_suggestions").insert({ partner_id: partner.id, product_id: product.id, suggested_name: input.suggestedCategoryName });
    }

    try {
      await notifyAllAdmins("محصول جدید همکار در انتظار بررسی 📦", `«${partner.business_name}» محصول «${input.title}» را ثبت کرد.`);
    } catch (e) { console.error(e); }

    revalidatePath("/partner/products");
    revalidatePath("/admin/partners/products");
    return { success: true, productId: product.id };
  } catch (e: unknown) {
    console.error("createPartnerProductAction:", e);
    const message = e instanceof Error ? e.message : "خطای غیرمنتظره‌ای رخ داد. لطفاً دوباره تلاش کنید.";
    return { error: message };
  }
}

export async function updatePartnerProductAction(productId: string, input: PartnerProductInput) {
  try {
    const partner = await requireActivePartner();
    const settings = await getPartnerSettings();
    const admin = createAdminClient();

    const { data: existing } = await admin.from("products").select("id").eq("id", productId).eq("partner_id", partner.id).single();
    if (!existing) return { error: "محصول یافت نشد یا متعلق به شما نیست." };

    if (!input.categoryId) return { error: "دسته‌بندی اصلی الزامی است." };

    const profit = input.sellPrice - input.partnerCostPrice;
    const profitPercent = input.sellPrice > 0 ? (profit / input.sellPrice) * 100 : 0;
    if (profitPercent < settings.min_profit_percent) {
      return { error: "سود سایت برای این محصول کمتر از حد مجاز است." };
    }

    const { error } = await admin.from("products").update({
      name: input.title.trim(), name_en: input.nameEn, description: input.description, short_description: input.shortDescription,
      category_id: input.categoryId, price: input.sellPrice, discount_price: input.discountSellPrice,
      images: input.images, image_alt_texts: input.imageAltTexts, tags: input.tags,
      stock: input.stockUnlimited ? 999999 : input.stock, brand: input.brand, weight_grams: input.weightGrams,
      is_sold_by_unit: input.isSoldByUnit, unit_label: input.unitLabel,
      has_min_order_quantity: input.hasMinOrderQty, min_order_quantity: input.minOrderQuantity,
      meta_title: input.metaTitle, meta_description: input.metaDescription, focus_keyword: input.focusKeyword,
      colors: input.colors, sizes: input.sizes,
      show_in_newest: input.showInNewest, is_popular: input.isPopular, is_stock: input.isStock,
      show_in_feed: input.showInFeed, reviews_enabled: input.reviewsEnabled,
      display_priority: input.displayPriority, max_purchase_qty: input.maxPurchaseQty,
      package_length_cm: input.packageLengthCm, package_width_cm: input.packageWidthCm, package_height_cm: input.packageHeightCm,
      gtin: input.gtin, model_version: input.modelVersion,
      fulfillment_type: input.fulfillmentType, china_price: input.chinaPrice,
      china_delivery_min: input.chinaDeliveryMin, china_delivery_max: input.chinaDeliveryMax, china_delivery_unit: input.chinaDeliveryUnit,
      china_terms_text: input.chinaTermsText, china_delivery_text: input.chinaDeliveryText, china_order_note: input.chinaOrderNote,
      partner_cost_price: input.partnerCostPrice, partner_stock_unlimited: input.stockUnlimited,
      partner_approval_status: "PENDING_REVIEW", is_active: false,
    }).eq("id", productId);

    if (error) return { error: error.message };

    await savePartnerProductCategories(admin, productId, input.categoryId, input.extraCategoryIds);

    revalidatePath("/partner/products");
    revalidatePath("/admin/partners/products");
    return { success: true };
  } catch (e: unknown) {
    console.error("updatePartnerProductAction:", e);
    const message = e instanceof Error ? e.message : "خطای غیرمنتظره‌ای رخ داد.";
    return { error: message };
  }
}

export async function getMyAllowedCategoriesAction() {
  try {
    const admin = createAdminClient();
    const { data } = await admin.from("categories")
      .select("id, name")
      .eq("partner_allowed", true)
      .eq("is_active", true)
      .order("name");
    return data ?? [];
  } catch {
    return [];
  }
}

export async function bulkAdjustPartnerProductPricesAction(input: {
  adjustType: "percent" | "fixed";
  direction: "increase" | "decrease";
  amount: number;
  roundingStep: number;
  roundingMode: "up" | "down" | "nearest";
}) {
  const partner = await requireActivePartner();
  const admin = createAdminClient();

  const { data: products } = await admin
    .from("products")
    .select("id, price, discount_price, partner_cost_price")
    .eq("partner_id", partner.id);

  if (!products || products.length === 0) {
    return { error: "محصولی برای تغییر قیمت یافت نشد." };
  }

  const factor =
    input.direction === "increase"
      ? 1 + input.amount / 100
      : 1 - input.amount / 100;

  let updatedCount = 0;
  for (const p of products) {
    let newPrice = p.price;
    let newDiscount = p.discount_price;
    let newCost = p.partner_cost_price ?? 0;

    if (input.adjustType === "percent") {
      newPrice = p.price * factor;
      newDiscount = p.discount_price ? p.discount_price * factor : null;
      newCost = (p.partner_cost_price ?? 0) * factor;
    } else {
      const diff = input.direction === "increase" ? input.amount : -input.amount;
      newPrice = p.price + diff;
      newDiscount = p.discount_price ? p.discount_price + diff : null;
      newCost = (p.partner_cost_price ?? 0) + diff;
    }

    // گرد کردن
    newPrice = Math.round(newPrice);
    newDiscount = newDiscount ? Math.round(newDiscount) : null;
    newCost = Math.round(newCost);
    if (newPrice < 0) newPrice = 0;
    if (newCost < 0) newCost = 0;

    const updatePayload: Record<string, number | null> = {
      price: newPrice,
      partner_cost_price: newCost,
    };
    if (p.discount_price !== null) {
      updatePayload.discount_price = newDiscount;
    }

    const { error } = await admin
      .from("products")
      .update(updatePayload)
      .eq("id", p.id);
    if (!error) updatedCount++;
  }

  revalidatePath("/partner/products");
  revalidatePath("/partner/products/bulk-price-update");
  return { success: true, updatedCount };
}