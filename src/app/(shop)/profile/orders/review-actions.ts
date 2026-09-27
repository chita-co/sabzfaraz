"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function submitReview(
  productId: string,
  rating: number,
  comment: string,
  reviewerName: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "برای ثبت نظر باید وارد شوید." };

  const { data: existing } = await supabase
    .from("product_reviews")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    return { error: "شما قبلاً برای این محصول نظر ثبت کرده‌اید و امکان ویرایش یا حذف آن وجود ندارد." };
  }

  const { error } = await supabase.from("product_reviews").insert({
    product_id: productId,
    user_id: user.id,
    rating,
    comment: comment || null,
    reviewer_name: reviewerName || "کاربر سبزفراز",
  });

  if (error) return { error: error.message };

  const adminClient = createAdminClient();
  const { data: allReviews } = await adminClient
    .from("product_reviews")
    .select("rating")
    .eq("product_id", productId);

  const count = allReviews?.length ?? 0;
  const avg = count > 0 ? allReviews!.reduce((s, r) => s + r.rating, 0) / count : 0;

  await adminClient.from("products").update({ rating_avg: avg, rating_count: count }).eq("id", productId);

  const { data: productRow } = await supabase.from("products").select("slug").eq("id", productId).single();

  revalidatePath("/profile/orders");
  if (productRow?.slug) revalidatePath(`/products/${productRow.slug}`);
  revalidatePath("/");
  return { success: true };
}