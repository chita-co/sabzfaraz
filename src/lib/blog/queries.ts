import { createClient } from "@/lib/supabase/server";
import { BlogPost, BlogCategory } from "@/types/blog";

const POST_SELECT =
  "id, title, slug, excerpt, content, main_image_url, product_id, status, meta_title, meta_description, tags, read_time, view_count, like_count, bookmark_count, is_featured, ai_generated, created_at, published_at";

export async function getPublishedPosts({
  page = 1, pageSize = 12, categorySlug, search,
}: { page?: number; pageSize?: number; categorySlug?: string; search?: string } = {}) {
  const supabase = await createClient();
  let query = supabase.from("blog_posts").select(POST_SELECT, { count: "exact" }).eq("status", "published");

  if (search?.trim()) {
    const term = `%${search.trim()}%`;
    query = query.or(`title.ilike.${term},excerpt.ilike.${term}`);
  }

  if (categorySlug) {
    const { data: cat } = await supabase.from("blog_categories").select("id").eq("slug", categorySlug).maybeSingle();
    if (!cat) return { posts: [] as BlogPost[], total: 0 };
    const { data: links } = await supabase.from("blog_post_categories").select("post_id").eq("category_id", cat.id);
    const ids = (links ?? []).map((r) => r.post_id);
    if (ids.length === 0) return { posts: [] as BlogPost[], total: 0 };
    query = query.in("id", ids);
  }

  const from = (page - 1) * pageSize;
  const { data, count, error } = await query.order("published_at", { ascending: false }).range(from, from + pageSize - 1);
  if (error) { console.error("getPublishedPosts:", error.message); return { posts: [] as BlogPost[], total: 0 }; }
  return { posts: (data ?? []) as BlogPost[], total: count ?? 0 };
}

export async function getFeaturedPosts(limit = 5) {
  const supabase = await createClient();
  const { data } = await supabase.from("blog_posts").select(POST_SELECT)
    .eq("status", "published").eq("is_featured", true)
    .order("published_at", { ascending: false }).limit(limit);
  return (data ?? []) as BlogPost[];
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const supabase = await createClient();
  const { data: rawPost } = await supabase.from("blog_posts").select(POST_SELECT + ", pending_category_name")
    .eq("slug", slug).eq("status", "published").maybeSingle();
  if (!rawPost) return null;

  const post = rawPost as unknown as BlogPost & { pending_category_name?: string | null };

  const [{ data: catLinks }, productResult] = await Promise.all([
    supabase.from("blog_post_categories").select("blog_categories(id, name, slug, description, cover_image_url, parent_id, status, created_at)").eq("post_id", post.id),
    post.product_id
      ? supabase.from("products").select("id, name, slug, images, price, discount_price").eq("id", post.product_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return {
    ...post,
    categories: (catLinks ?? []).flatMap((c) => {
      const cats = (c as unknown as { blog_categories: BlogCategory | BlogCategory[] | null }).blog_categories;
      if (!cats) return [];
      return Array.isArray(cats) ? cats : [cats];
    }).filter(Boolean) as BlogCategory[],
    product: productResult.data,
  } as BlogPost;
}

export async function getRelatedPosts(postId: string, limit = 6) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_related_blog_posts", { p_post_id: postId, p_limit: limit });
  if (error) { console.error("getRelatedPosts:", error.message); return []; }
  return (data ?? []) as BlogPost[];
}

export async function getPostsForProduct(productId: string, limit = 6) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_blog_posts_for_product", { p_product_id: productId, p_limit: limit });
  if (error) { console.error("getPostsForProduct:", error.message); return []; }
  return (data ?? []) as BlogPost[];
}

export async function getBlogCategories() {
  const supabase = await createClient();
  const { data } = await supabase.from("blog_categories").select("*").eq("status", "active").order("name");
  return (data ?? []) as BlogCategory[];
}

export async function getBlogCategoryBySlug(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("blog_categories").select("*").eq("slug", slug).eq("status", "active").maybeSingle();
  return data as BlogCategory | null;
}

export async function incrementPostView(postId: string) {
  const supabase = await createClient();
  await supabase.rpc("increment_blog_post_view", { p_post_id: postId });
}

export async function getRandomFeaturedPost(excludeId?: string) {
  const supabase = await createClient();
  const query = supabase
    .from("blog_posts")
    .select(POST_SELECT)
    .eq("status", "published")
    .order("view_count", { ascending: false })
    .limit(5);

  const { data } = await query;
  const pool = (data ?? []).filter((p) => p.id !== excludeId);
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)] as BlogPost;
}

export async function getCommentsForPost(postId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("blog_comments").select("id, user_name, content, created_at").eq("post_id", postId).order("created_at", { ascending: false });
  return data ?? [];
}