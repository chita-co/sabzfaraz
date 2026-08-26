import { createAdminClient } from "@/lib/supabase/admin";
import { generateArticleWithGemini, generateArticleFromTopic } from "./ai/gemini";
import { generateAndUploadCoverImage } from "./ai/image";
import { generateUniqueBlogSlug } from "./slug";

export async function generateBlogPostForProduct(productId: string) {
  const admin = createAdminClient();

  const { data: product, error: productError } = await admin
    .from("products")
    .select("id, name, description, short_description, price, brand, images")
    .eq("id", productId)
    .single();
  if (productError || !product) throw new Error("محصول یافت نشد");

  const { data: existingPost } = await admin.from("blog_posts").select("id").eq("product_id", productId).maybeSingle();
  if (existingPost) return { skipped: true, reason: "این محصول قبلاً مقاله دارد" };

  const { data: settings } = await admin.from("blog_bot_settings").select("*").eq("id", 1).single();
  if (!settings?.enabled) return { skipped: true, reason: "ربات غیرفعال است" };

  const { data: categoriesRows } = await admin.from("blog_categories").select("name").eq("status", "active");
  const existingCategories = (categoriesRows ?? []).map((c) => c.name);

  const article = await generateArticleWithGemini({
    productName: product.name,
    description: product.description ?? "",
    shortDescription: product.short_description,
    price: product.price,
    brand: product.brand,
    existingCategories,
    tone: settings.tone,
    minWords: settings.min_words,
    maxWords: settings.max_words,
    customPrompt: settings.custom_prompt,
  });

  const slug = await generateUniqueBlogSlug(admin, article.slug || article.title);

  let coverUrl: string | null = null;
  if (settings.generate_cover_image) coverUrl = await generateAndUploadCoverImage(article.image_prompt, slug);
  if (!coverUrl) coverUrl = product.images?.[0] ?? null;

  let categoryId: string | null = null;
  let pendingCategoryName: string | null = null;
  const { data: matchedCategory } = await admin.from("blog_categories").select("id").ilike("name", article.suggested_category).eq("status", "active").maybeSingle();
  if (matchedCategory) categoryId = matchedCategory.id;
  else if (article.is_new_category) {
    await admin.from("blog_category_requests").insert({ name: article.suggested_category, suggested_by: "ai", status: "pending" });
    pendingCategoryName = article.suggested_category;
  }

  const contentWithCta = article.content.replaceAll("[PRODUCT_CTA]", `<div data-product-cta="${product.id}"></div>`);

  const { data: inserted, error: insertError } = await admin
    .from("blog_posts")
    .insert({
      title: article.title,
      slug,
      excerpt: article.excerpt,
      content: contentWithCta,
      main_image_url: coverUrl,
      product_id: product.id,
      status: "pending_review",
      meta_title: article.meta_title,
      meta_description: article.meta_description,
      tags: article.tags ?? [],
      read_time: article.read_time ?? Math.max(3, Math.ceil((article.content?.split(" ").length ?? 800) / 200)),
      ai_generated: true,
      pending_category_name: pendingCategoryName,
    })
    .select("id")
    .single();

  if (insertError || !inserted) throw new Error(`ذخیره مقاله ناموفق بود: ${insertError?.message}`);
  if (categoryId) await admin.from("blog_post_categories").insert({ post_id: inserted.id, category_id: categoryId });

  return { skipped: false, postId: inserted.id, title: article.title };
}

export async function generateBlogPostFromTopic(topic: string, briefing: string, productId: string | null) {
  const admin = createAdminClient();

  const { data: settings } = await admin.from("blog_bot_settings").select("*").eq("id", 1).single();
  const { data: categoriesRows } = await admin.from("blog_categories").select("name").eq("status", "active");
  const existingCategories = (categoriesRows ?? []).map((c) => c.name);

  let recommendedProduct: { id: string; name: string; price: number; description: string | null; images: string[] } | null = null;
  if (productId) {
    const { data: p } = await admin.from("products").select("id, name, price, description, images").eq("id", productId).maybeSingle();
    recommendedProduct = p;
  }

  const article = await generateArticleFromTopic({
    topic,
    briefing,
    existingCategories,
    tone: settings?.tone ?? "رسمی، قابل‌اعتماد و جذاب",
    minWords: settings?.min_words ?? 800,
    maxWords: settings?.max_words ?? 1400,
    recommendedProduct: recommendedProduct ? { name: recommendedProduct.name, price: recommendedProduct.price, description: recommendedProduct.description ?? "" } : null,
  });

  const slug = await generateUniqueBlogSlug(admin, article.slug || article.title);

  let coverUrl: string | null = null;
  if (settings?.generate_cover_image !== false) coverUrl = await generateAndUploadCoverImage(article.image_prompt, slug);
  if (!coverUrl && recommendedProduct?.images?.[0]) coverUrl = recommendedProduct.images[0];

  let categoryId: string | null = null;
  let pendingCategoryName: string | null = null;
  const { data: matchedCategory } = await admin.from("blog_categories").select("id").ilike("name", article.suggested_category).eq("status", "active").maybeSingle();
  if (matchedCategory) categoryId = matchedCategory.id;
  else if (article.is_new_category) {
    await admin.from("blog_category_requests").insert({ name: article.suggested_category, suggested_by: "ai", status: "pending" });
    pendingCategoryName = article.suggested_category;
  }

  const contentWithCta = recommendedProduct
    ? article.content.replaceAll("[PRODUCT_CTA]", `<div data-product-cta="${recommendedProduct.id}"></div>`)
    : article.content.replaceAll("[PRODUCT_CTA]", "");

  const { data: inserted, error } = await admin.from("blog_posts").insert({
    title: article.title,
    slug,
    excerpt: article.excerpt,
    content: contentWithCta,
    main_image_url: coverUrl,
    product_id: recommendedProduct?.id ?? null,
    status: "pending_review",
    meta_title: article.meta_title,
    meta_description: article.meta_description,
    tags: article.tags ?? [],
    read_time: article.read_time ?? 5,
    ai_generated: true,
    pending_category_name: pendingCategoryName,
  }).select("id").single();

  if (error || !inserted) throw new Error(`ذخیره مقاله ناموفق بود: ${error?.message}`);
  if (categoryId) await admin.from("blog_post_categories").insert({ post_id: inserted.id, category_id: categoryId });

  return inserted.id as string;
}

export async function runBlogBot(limit = 3, options: { force?: boolean } = {}) {
  const admin = createAdminClient();
  const { data: settings } = await admin.from("blog_bot_settings").select("*").eq("id", 1).single();
  if (!settings?.enabled) return { ran: false, reason: "ربات غیرفعال است", results: [] as unknown[] };

  if (settings.is_running && settings.last_run_started_at) {
    const startedAgo = Date.now() - new Date(settings.last_run_started_at).getTime();
    if (startedAgo < 10 * 60 * 1000) {
      return { ran: false, reason: "ربات همین الان در حال نوشتن مقاله است", results: [] as unknown[] };
    }
  }

  if (!options.force && settings.rate_limited_until && new Date(settings.rate_limited_until) > new Date()) {
    return { ran: false, reason: `ربات به‌دلیل محدودیت سهمیه تا ${new Date(settings.rate_limited_until).toLocaleString("fa-IR")} متوقف است`, results: [] as unknown[] };
  }

  await admin.from("blog_bot_settings").update({ is_running: true, last_run_started_at: new Date().toISOString(), last_error: null }).eq("id", 1);

  const { data: postedProductIds } = await admin.from("blog_posts").select("product_id").not("product_id", "is", null);
  const excludeIds = (postedProductIds ?? []).map((r) => r.product_id).filter(Boolean) as string[];

  let query = admin.from("products").select("id").eq("is_active", true).order("created_at", { ascending: false }).limit(limit);
  if (excludeIds.length > 0) query = query.not("id", "in", `(${excludeIds.join(",")})`);
  const { data: candidateProducts } = await query;

  const results: unknown[] = [];
  let rateLimitHit = false;

  for (const p of candidateProducts ?? []) {
    if (rateLimitHit) break;
    try {
      results.push({ productId: p.id, ...(await generateBlogPostForProduct(p.id)) });
    } catch (e: unknown) {
      const err = e as Error & { isRateLimit?: boolean; retryAfterSeconds?: number };
      if (err?.isRateLimit) {
        rateLimitHit = true;
        const until = new Date(Date.now() + (err.retryAfterSeconds ? err.retryAfterSeconds * 1000 : 60 * 60 * 1000)).toISOString();
        await admin.from("blog_bot_settings").update({ rate_limited_until: until, last_error: err.message }).eq("id", 1);
        results.push({ productId: p.id, skipped: true, reason: `محدودیت سهمیه؛ تا ${new Date(until).toLocaleString("fa-IR")} صبر می‌کند` });
      } else {
        results.push({ productId: p.id, skipped: true, reason: err.message });
        await admin.from("blog_bot_settings").update({ last_error: err.message }).eq("id", 1);
      }
    }
  }

  const successCount = results.filter((r) => !(r as { skipped?: boolean }).skipped).length;
  await admin.from("blog_bot_settings").update({
    is_running: false,
    last_run_finished_at: new Date().toISOString(),
    last_run_summary: `${successCount} مقاله ساخته شد از ${results.length} بررسی‌شده`,
  }).eq("id", 1);

  return { ran: true, results };
}