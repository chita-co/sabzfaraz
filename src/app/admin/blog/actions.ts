"use server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { uploadImage } from "@/lib/arvan";
import { runBlogBot, generateBlogPostFromTopic } from "@/lib/blog/generatePost";
import { generateUniqueBlogSlug } from "@/lib/blog/slug";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("دسترسی غیرمجاز");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "ADMIN") throw new Error("دسترسی غیرمجاز");
  return user;
}

export async function updatePostStatusAction(postId: string, status: "published" | "rejected" | "draft") {
  await requireAdmin();
  const admin = createAdminClient();
  const payload: Record<string, unknown> = { status };
  if (status === "published") payload.published_at = new Date().toISOString();
  const { error } = await admin.from("blog_posts").update(payload).eq("id", postId);
  if (error) return { error: error.message };
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  return { success: true };
}

export async function triggerBlogBotAction() {
  await requireAdmin();
  try {
    const result = await runBlogBot(3, { force: true });
    revalidatePath("/admin/blog");
    revalidatePath("/admin/blog/settings");
    return { success: true, result };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "خطای ناشناخته";
    return { error: message };
  }
}

export async function updateBlogBotSettingsAction(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("blog_bot_settings").update({
    enabled: formData.get("enabled") === "on",
    interval_hours: Number(formData.get("interval_hours")) || 6,
    min_words: Number(formData.get("min_words")) || 800,
    max_words: Number(formData.get("max_words")) || 1400,
    tone: String(formData.get("tone") || ""),
    generate_cover_image: formData.get("generate_cover_image") === "on",
    custom_prompt: String(formData.get("custom_prompt") || "") || null,
  }).eq("id", 1);
  if (error) return { error: error.message };
  revalidatePath("/admin/blog/settings");
  return { success: true };
}

export async function generateArticleFromTopicAction(topic: string, briefing: string, productId: string | null) {
  await requireAdmin();
  try {
    const postId = await generateBlogPostFromTopic(topic, briefing, productId);
    revalidatePath("/admin/blog");
    return { success: true, postId };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "خطای ناشناخته";
    return { error: message };
  }
}

export async function searchProductsForArticleAction(query: string) {
  await requireAdmin();
  const admin = createAdminClient();
  if (!query || query.trim().length < 2) return [];
  const { data } = await admin.from("products").select("id, name, price, slug").ilike("name", `%${query.trim()}%`).eq("is_active", true).limit(8);
  return data ?? [];
}

export async function approveCategoryRequestAction(requestId: string, parentId?: string | null) {
  await requireAdmin();
  const admin = createAdminClient();
  const { data: request } = await admin.from("blog_category_requests").select("*").eq("id", requestId).single();
  if (!request) return { error: "درخواست یافت نشد" };

  const slug = request.name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || `cat-${Date.now()}`;
  const { data: newCat, error: catError } = await admin.from("blog_categories")
    .insert({ name: request.name, slug, description: request.description, parent_id: parentId ?? request.parent_id, status: "active" })
    .select("id").single();
  if (catError || !newCat) return { error: catError?.message ?? "خطا در ساخت دسته" };

  await admin.from("blog_category_requests").update({ status: "approved" }).eq("id", requestId);

  const { data: postsToLink } = await admin.from("blog_posts").select("id").eq("pending_category_name", request.name);
  for (const p of postsToLink ?? []) {
    await admin.from("blog_post_categories").upsert({ post_id: p.id, category_id: newCat.id }, { onConflict: "post_id,category_id" });
  }
  await admin.from("blog_posts").update({ pending_category_name: null }).eq("pending_category_name", request.name);

  revalidatePath("/admin/blog/categories");
  return { success: true };
}

export async function rejectCategoryRequestAction(requestId: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("blog_category_requests").update({ status: "rejected" }).eq("id", requestId);
  if (error) return { error: error.message };
  revalidatePath("/admin/blog/categories");
  return { success: true };
}

export async function createCategoryAction(name: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const slug = name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || `cat-${Date.now()}`;
  const { error } = await admin.from("blog_categories").insert({ name: name.trim(), slug, status: "active" });
  if (error) return { error: error.message };
  revalidatePath("/admin/blog/categories");
  return { success: true };
}

export async function renameCategoryAction(categoryId: string, newName: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("blog_categories").update({ name: newName.trim() }).eq("id", categoryId);
  if (error) return { error: error.message };
  revalidatePath("/admin/blog/categories");
  return { success: true };
}

export async function moveCategoryPostsAction(fromCategoryId: string, toCategoryId: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { data: links } = await admin.from("blog_post_categories").select("post_id").eq("category_id", fromCategoryId);
  const postIds = (links ?? []).map((l) => l.post_id);
  if (postIds.length === 0) return { success: true, count: 0 };

  await admin.from("blog_post_categories").delete().eq("category_id", fromCategoryId);
  for (const postId of postIds) {
    await admin.from("blog_post_categories").upsert({ post_id: postId, category_id: toCategoryId }, { onConflict: "post_id,category_id" });
  }
  revalidatePath("/admin/blog/categories");
  return { success: true, count: postIds.length };
}

export async function assignPostToCategoryAction(postId: string, categoryId: string) {
  await requireAdmin();
  const admin = createAdminClient();
  await admin.from("blog_post_categories").upsert({ post_id: postId, category_id: categoryId }, { onConflict: "post_id,category_id" });
  await admin.from("blog_posts").update({ pending_category_name: null }).eq("id", postId);
  revalidatePath("/admin/blog/categories");
  return { success: true };
}

export async function getPostForEditAction(postId: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const [{ data: post }, { data: catLinks }] = await Promise.all([
    admin.from("blog_posts").select("*").eq("id", postId).single(),
    admin.from("blog_post_categories").select("category_id").eq("post_id", postId),
  ]);
  return post ? { ...post, categoryIds: (catLinks ?? []).map((c) => c.category_id) } : null;
}

interface PostFormPayload {
  title: string; excerpt: string; content: string; meta_title: string; meta_description: string;
  tags: string; main_image_url: string; status: string; categoryIds: string[]; productId: string | null;
}

export async function updatePostAction(postId: string, payload: PostFormPayload) {
  await requireAdmin();
  const admin = createAdminClient();
  const updatePayload: Record<string, unknown> = {
    title: payload.title,
    excerpt: payload.excerpt,
    content: payload.content,
    meta_title: payload.meta_title,
    meta_description: payload.meta_description,
    tags: payload.tags.split(",").map((t) => t.trim()).filter(Boolean),
    main_image_url: payload.main_image_url || null,
    product_id: payload.productId || null,
    status: payload.status,
  };
  if (payload.status === "published") updatePayload.published_at = new Date().toISOString();

  const { error } = await admin.from("blog_posts").update(updatePayload).eq("id", postId);
  if (error) return { error: error.message };

  await admin.from("blog_post_categories").delete().eq("post_id", postId);
  for (const categoryId of payload.categoryIds) {
    await admin.from("blog_post_categories").upsert({ post_id: postId, category_id: categoryId }, { onConflict: "post_id,category_id" });
  }

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  return { success: true };
}

export async function createPostAction(payload: PostFormPayload) {
  await requireAdmin();
  const admin = createAdminClient();
  const slug = await generateUniqueBlogSlug(admin, payload.title);

  const insertPayload: Record<string, unknown> = {
    title: payload.title,
    slug,
    excerpt: payload.excerpt,
    content: payload.content,
    meta_title: payload.meta_title,
    meta_description: payload.meta_description,
    tags: payload.tags.split(",").map((t) => t.trim()).filter(Boolean),
    main_image_url: payload.main_image_url || null,
    product_id: payload.productId || null,
    status: payload.status,
    ai_generated: false,
  };
  if (payload.status === "published") insertPayload.published_at = new Date().toISOString();

  const { data: inserted, error } = await admin.from("blog_posts").insert(insertPayload).select("id").single();
  if (error || !inserted) return { error: error?.message ?? "خطا در ساخت مقاله" };

  for (const categoryId of payload.categoryIds) {
    await admin.from("blog_post_categories").upsert({ post_id: inserted.id, category_id: categoryId }, { onConflict: "post_id,category_id" });
  }

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  return { success: true, postId: inserted.id };
}

export async function uploadEditorImageAction(formData: FormData) {
  await requireAdmin();
  const file = formData.get("file") as File | null;
  if (!file) return { error: "فایلی انتخاب نشده" };
  const arrayBuffer = await file.arrayBuffer();
  const webpBuffer = await sharp(Buffer.from(arrayBuffer)).resize(1400, undefined, { withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
  const key = `blog/content/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
  const url = await uploadImage(webpBuffer, key);
  return { url };
}