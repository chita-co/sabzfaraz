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
    .select("created_at")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    const hoursPassed = (Date.now() - new Date(existing.created_at).getTime()) / (1000 * 60 * 60);
    if (hoursPassed > 24) {
      return { error: "مهلت ۲۴ ساعته برای ویرایش این نظر به پایان رسیده است." };
    }
  }

  const { error } = await supabase.from("product_reviews").upsert(
    {
      product_id: productId,
      user_id: user.id,
      rating,
      comment: comment || null,
      reviewer_name: reviewerName || "کاربر سبزفراز",
    },
    { onConflict: "user_id,product_id" }
  );

  if (error) return { error: error.message };

  const adminClient = createAdminClient();
  const { data: allReviews } = await adminClient
    .from("product_reviews")
    .select("rating")
    .eq("product_id", productId);

  const count = allReviews?.length ?? 0;
  const avg = count > 0 ? allReviews!.reduce((s, r) => s + r.rating, 0) / count : 0;

  await adminClient.from("products").update({ rating_avg: avg, rating_count: count }).eq("id", productId);

  revalidatePath("/profile/orders");
  revalidatePath("/products", "layout");
  revalidatePath("/");
  return { success: true };
}