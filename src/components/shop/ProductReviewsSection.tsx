"use client";

import { useState } from "react";
import Image from "next/image";
import { submitReview } from "@/app/(shop)/profile/orders/review-actions";
import { StarRatingInput, StarRatingDisplay } from "./StarRating";

interface ReviewEntry {
  rating: number;
  comment: string | null;
  created_at: string;
}

interface ProductForReview {
  productId: string;
  name: string;
  image: string;
  existingReview: ReviewEntry | null;
}

export default function ProductReviewsSection({
  products,
  defaultReviewerName,
}: {
  products: ProductForReview[];
  defaultReviewerName: string;
}) {
  if (products.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
      <h2 className="font-bold text-gray-800 mb-4">امتیاز و نظر شما به محصولات خریداری‌شده</h2>
      <div className="space-y-3">
        {products.map((p) => (
          <ReviewRow key={p.productId} product={p} defaultReviewerName={defaultReviewerName} />
        ))}
      </div>
    </div>
  );
}

function ReviewRow({
  product,
  defaultReviewerName,
}: {
  product: ProductForReview;
  defaultReviewerName: string;
}) {
  const [editing, setEditing] = useState(!product.existingReview);
  const [rating, setRating] = useState(product.existingReview?.rating ?? 0);
  const [comment, setComment] = useState(product.existingReview?.comment ?? "");
  const [reviewerName, setReviewerName] = useState(defaultReviewerName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(!!product.existingReview);

  const [editLocked] = useState(() => {
    return product.existingReview
      ? (Date.now() - new Date(product.existingReview.created_at).getTime()) / (1000 * 60 * 60) > 24
      : false;
  });

  async function handleSubmit() {
    if (rating === 0) {
      setError("لطفاً امتیاز را انتخاب کنید.");
      return;
    }
    setSaving(true);
    setError(null);
    const result = await submitReview(product.productId, rating, comment, reviewerName);
    setSaving(false);
    if (result?.error) {
      setError(result.error);
    } else {
      setSaved(true);
      setEditing(false);
    }
  }

  return (
    <div className="flex gap-3 border rounded-xl p-3">
      <div className="relative w-14 h-14 shrink-0">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover rounded-lg"
          sizes="56px"
        />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-800 mb-2">{product.name}</p>

        {!editing && saved ? (
          <div className="flex items-center gap-2">
            <StarRatingDisplay value={rating} size={16} />
            <button onClick={() => setEditing(true)} className="text-xs text-green-600 hover:underline">
              {editLocked ? "دیدن نظر" : "ویرایش نظر"}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <StarRatingInput value={rating} onChange={setRating} />
            <input
              type="text"
              placeholder="نام شما (نمایش داده می‌شود)"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              disabled={editLocked}
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:bg-gray-100 disabled:text-gray-500"
            />
            <textarea
              placeholder="نظر شما (اختیاری)"
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={editLocked}
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:bg-gray-100 disabled:text-gray-500"
            />
            {editLocked ? (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">مهلت ۲۴ ساعته ویرایش این نظر به پایان رسیده است.</span>
                <button onClick={() => setEditing(false)} className="text-xs text-gray-500 hover:underline">
                  بستن
                </button>
              </div>
            ) : (
              <>
                {error && <p className="text-red-600 text-xs">{error}</p>}
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="rounded-lg bg-green-600 px-4 py-1.5 text-xs text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {saving ? "در حال ثبت..." : "ثبت امتیاز و نظر"}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}