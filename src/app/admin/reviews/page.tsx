import { createClient } from "@/lib/supabase/server";
import ReviewsManager from "@/components/admin/ReviewsManager";

// نوع دقیق برای ردیف‌های دریافت‌شده از Supabase
type ReviewRow = {
  id: string;
  product_id: string;
  reviewer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
  admin_reply: string | null;
  admin_replied_at: string | null;
  product: { name: string } | null;
};

export default async function AdminReviewsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("product_reviews")
    .select("*, product:products(name)")
    .order("created_at", { ascending: false });

  const reviews = (data as ReviewRow[] ?? []).map((r) => ({
    id: r.id,
    product_id: r.product_id,
    reviewer_name: r.reviewer_name,
    rating: r.rating,
    comment: r.comment,
    created_at: r.created_at,
    admin_reply: r.admin_reply,
    admin_replied_at: r.admin_replied_at,
    product_name: r.product?.name ?? "—",
  }));

  return <ReviewsManager reviews={reviews} />;
}