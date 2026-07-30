"use client";

import { useState } from "react";
import { Trash2, Star } from "lucide-react";
import { deleteReview } from "@/app/admin/reviews/actions";

interface ReviewRow {
  id: string;
  product_id: string;
  reviewer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
  product_name: string;
}

export default function ReviewsManager({ reviews }: { reviews: ReviewRow[] }) {
  const [rows, setRows] = useState(reviews);
  const [filter, setFilter] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(r: ReviewRow) {
    if (!confirm(`آیا از حذف نظر «${r.reviewer_name}» برای محصول «${r.product_name}» مطمئن هستید؟`)) return;
    setDeletingId(r.id);
    const result = await deleteReview(r.id, r.product_id);
    setDeletingId(null);
    if (result?.error) {
      alert(result.error);
    } else {
      setRows((prev) => prev.filter((x) => x.id !== r.id));
    }
  }

  const filtered = rows.filter(
    (r) =>
      r.product_name.includes(filter) ||
      r.reviewer_name.includes(filter) ||
      (r.comment ?? "").includes(filter)
  );

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-5">نظرات و امتیازهای کاربران</h1>

      <input
        type="text"
        placeholder="جستجو در محصول، نام کاربر یا متن نظر..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="admin-input mb-4 w-full sm:w-80"
      />

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr><th>محصول</th><th>کاربر</th><th>امتیاز</th><th>متن نظر</th><th>تاریخ</th><th></th></tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td>{r.product_name}</td>
                <td>{r.reviewer_name}</td>
                <td>
                  <div style={{ display: "flex", gap: 1 }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} size={13} fill={i <= r.rating ? "#f59e0b" : "none"} color="#f59e0b" />
                    ))}
                  </div>
                </td>
                <td style={{ maxWidth: 260 }}>{r.comment || "—"}</td>
                <td className="text-xs text-gray-500">{new Date(r.created_at).toLocaleDateString("fa-IR")}</td>
                <td>
                  <button
                    onClick={() => handleDelete(r)}
                    disabled={deletingId === r.id}
                    className="admin-btn admin-btn-danger"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-6">نظری یافت نشد.</p>
        )}
      </div>
    </div>
  );
}