"use server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { runBlogBot } from "@/lib/blog/generatePost";

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
    const result = await runBlogBot(3);
    revalidatePath("/admin/blog");
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
  await admin.from("blog_posts").update({ pending_category_name: null }).eq("pending_category_name", request.name);

  const { data: postsToLink } = await admin.from("blog_posts").select("id").eq("pending_category_name", request.name);
  for (const p of postsToLink ?? []) {
    await admin.from("blog_post_categories").insert({ post_id: p.id, category_id: newCat.id }).select().maybeSingle();
  }

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

export async function getPostForEditAction(postId: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { data } = await admin.from("blog_posts").select("*").eq("id", postId).single();
  return data;
}

export async function updatePostAction(postId: string, payload: {
  title: string; excerpt: string; content: string; meta_title: string; meta_description: string; tags: string; main_image_url: string; status: string;
}) {
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
    status: payload.status,
  };
  if (payload.status === "published") updatePayload.published_at = new Date().toISOString();

  const { error } = await admin.from("blog_posts").update(updatePayload).eq("id", postId);
  if (error) return { error: error.message };
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  return { success: true };
}