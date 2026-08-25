import { slugify } from "@/lib/slug";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function generateUniqueBlogSlug(supabase: SupabaseClient, rawInput: string) {
  let base = slugify(rawInput);
  if (!base || base.length < 2) base = `article-${Math.random().toString(36).slice(2, 8)}`;

  let candidate = base;
  let suffix = 2;
  while (true) {
    const { data: dup } = await supabase.from("blog_posts").select("id").eq("slug", candidate).maybeSingle();
    if (!dup) break;
    candidate = `${base}-${suffix}`;
    suffix++;
  }
  return candidate;
}