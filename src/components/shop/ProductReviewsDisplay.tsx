import { Star } from "lucide-react";

interface ReviewRow {
  id: string;
  reviewer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
  admin_reply: string | null;
  admin_replied_at: string | null;
}

export default function ProductReviewsDisplay({
  reviews,
  avgRating,
  reviewCount,
}: {
  reviews: ReviewRow[];
  avgRating: number;
  reviewCount: number;
}) {
  return (
    <div className="product-reviews-section">
      <div className="product-reviews-header">
        <h2 className="section-title">امتیاز و نظرات کاربران</h2>
        {reviewCount > 0 ? (
          <div className="product-reviews-summary">
            <div className="product-reviews-avg">{avgRating.toFixed(1)}</div>
            <div>
              <div className="product-reviews-stars">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} size={16} fill={i <= Math.round(avgRating) ? "#f59e0b" : "none"} color="#f59e0b" />
                ))}
              </div>
              <p className="product-reviews-count">{reviewCount.toLocaleString("fa-IR")} نظر</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">هنوز نظری برای این محصول ثبت نشده است.</p>
        )}
      </div>

      {reviews.length > 0 && (
        <div className="reviews-scroll">
          {reviews.map((r) => (
            <div key={r.id} className="review-card">
              <div className="review-card-header">
                <span className="review-card-name">{r.reviewer_name}</span>
                <div className="review-card-stars">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} size={12} fill={i <= r.rating ? "#f59e0b" : "none"} color="#f59e0b" />
                  ))}
                </div>
              </div>
              {r.comment && <p className="review-card-comment">{r.comment}</p>}
              {r.admin_reply && (
  <div className="review-card-admin-reply">
    <span className="review-card-admin-reply-label">پاسخ فروشگاه سبزفراز</span>
    <p>{r.admin_reply}</p>
  </div>
)}
              <p className="review-card-date">{new Date(r.created_at).toLocaleDateString("fa-IR")}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}