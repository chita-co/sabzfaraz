import { createClient } from "@/lib/supabase/server";

export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[\u200C\u200F\u200E]/g, "")
    .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, "")
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

// 👇 از اینجا به بعد اضافه می‌شود
export async function generateUniqueProductSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  nameEn: string | null | undefined,
  fallbackName: string,
  excludeId?: string
): Promise<string> {
  const en = (nameEn ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/(\d)[.,](\d)/g, "$1-$2")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80)
    .replace(/-$/, "");

  if (en.length < 6 || !/[a-z]/.test(en)) {
    return generateUniqueSlug(supabase, fallbackName, excludeId);
  }

  let candidate = en;
  let suffix = 2;
  while (true) {
    let query = supabase.from("products").select("id").eq("slug", candidate);
    if (excludeId) query = query.neq("id", excludeId);
    const { data: dup } = await query.maybeSingle();
    if (!dup) break;
    candidate = `${en}-${suffix}`;
    suffix++;
  }
  return candidate;
}