"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function deleteReview(reviewId: string, productId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("product_reviews").delete().eq("id", reviewId);
  if (error) return { error: error.message };

  const adminClient = createAdminClient();
  const { data: remaining } = await adminClient
    .from("product_reviews")
    .select("rating")
    .eq("product_id", productId);

  const count = remaining?.length ?? 0;
  const avg = count > 0 ? remaining!.reduce((s, r) => s + r.rating, 0) / count : 0;

  await adminClient.from("products").update({ rating_avg: avg, rating_count: count }).eq("id", productId);

  revalidatePath("/admin/reviews");
  revalidatePath("/products", "layout");
  revalidatePath("/");
  return { success: true };
}