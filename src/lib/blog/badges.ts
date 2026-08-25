import { createClient } from "@/lib/supabase/server";

export async function getAllBadges() {
  const supabase = await createClient();
  const { data } = await supabase.from("blog_badges").select("*").order("requirement_value");
  return data ?? [];
}

export async function getUserBadgeIds(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("blog_user_badges").select("badge_id").eq("user_id", userId);
  return new Set((data ?? []).map((r) => r.badge_id));
}