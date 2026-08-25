"use server";
import { createClient } from "@/lib/supabase/server";

export async function toggleLikeAction(postId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "برای لایک کردن باید وارد شوید" };
  const { data, error } = await supabase.rpc("toggle_blog_post_like", { p_post_id: postId, p_user_id: user.id });
  if (error) return { error: error.message };
  return { liked: data.liked, likeCount: data.likeCount };
}

export async function toggleBookmarkAction(postId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "برای نشانک باید وارد شوید" };
  const { data, error } = await supabase.rpc("toggle_blog_post_bookmark", { p_post_id: postId, p_user_id: user.id });
  if (error) return { error: error.message };
  return { bookmarked: data.bookmarked, bookmarkCount: data.bookmarkCount };
}

export async function logViewActivityAction(postId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { earnedBadges: [] };
  await supabase.rpc("log_blog_post_view_activity", { p_post_id: postId, p_user_id: user.id });
  const { data: badges } = await supabase.from("blog_user_badges").select("badge_id, blog_badges(title, icon)").eq("user_id", user.id);
  return { earnedBadges: badges ?? [] };
}

export async function addCommentAction(postId: string, content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "برای ثبت نظر باید وارد شوید" };
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();

  const { error } = await supabase.from("blog_comments").insert({
    post_id: postId, user_id: user.id, user_name: profile?.full_name ?? "کاربر سبزفراز", content: content.trim(),
  });
  if (error) return { error: error.message };
  return { success: true };
}