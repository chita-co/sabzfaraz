import { createClient } from "@/lib/supabase/server";

// نوع برگشتی از createClient
type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

// نوع رکوردهای بازگشتی از product_reviews
type ReviewSummary = {
  product_id: string;
  rating: number;
};

export async function getRatingsMap(
  supabase: SupabaseClient,
  productIds: string[]
): Promise<Map<string, { avg: number; count: number }>> {
  if (productIds.length === 0) return new Map();

  const { data } = await supabase
    .from("product_reviews")
    .select("product_id, rating")
    .in("product_id", productIds);

  const sums = new Map<string, { sum: number; count: number }>();
  (data as ReviewSummary[] ?? []).forEach((r) => {
    const cur = sums.get(r.product_id) ?? { sum: 0, count: 0 };
    cur.sum += r.rating;
    cur.count += 1;
    sums.set(r.product_id, cur);
  });

  const result = new Map<string, { avg: number; count: number }>();
  sums.forEach((v, k) => result.set(k, { avg: v.sum / v.count, count: v.count }));
  return result;
}