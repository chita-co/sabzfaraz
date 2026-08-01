import { createClient } from "@/lib/supabase/server";

export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function generateUniqueSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rawInput: string,
  excludeId?: string
): Promise<string> {
  let base = slugify(rawInput);
  if (!base || base.length < 2) {
    base = `p-${Math.random().toString(36).slice(2, 8)}`;
  }

  let candidate = base;
  let suffix = 2;
  while (true) {
    let query = supabase.from("products").select("id").eq("slug", candidate);
    if (excludeId) query = query.neq("id", excludeId);
    const { data: dup } = await query.maybeSingle();
    if (!dup) break;
    candidate = `${base}-${suffix}`;
    suffix++;
  }
  return candidate;
}