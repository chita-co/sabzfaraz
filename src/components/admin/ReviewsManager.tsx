"use client";

import { Fragment, useState } from "react";
import { Trash2, Star, MessageCircle } from "lucide-react";
import { deleteReview, replyToReview } from "@/app/admin/reviews/actions";

interface ReviewRow {
  id: string;
  product_id: string;
  reviewer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
  admin_reply: string | null;
  admin_replied_at: string | null;
  product_name: string;
}

export default function ReviewsManager({ reviews }: { reviews: ReviewRow[] }) {
  const [rows, setRows] = useState(reviews);
  const [filter, setFilter] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openReplyId, setOpenReplyId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [savingReplyId, setSavingReplyId] = useState<string | null>(null);
  const [replyError, setReplyError] = useState<string | null>(null);

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

  function openReplyBox(r: ReviewRow) {
    setOpenReplyId(r.id);
    setReplyDraft(r.admin_reply ?? "");
    setReplyError(null);
  }

  async function handleSaveReply(r: ReviewRow) {
    setSavingReplyId(r.id);
    setReplyError(null);
    const result = await replyToReview(r.id, r.product_id, replyDraft);
    setSavingReplyId(null);
    if (result?.error) {
      setReplyError(result.error);
      return;
    }
    const trimmed = replyDraft.trim();
    setRows((prev) =>
      prev.map((x) =>
        x.id === r.id
          ? { ...x, admin_reply: trimmed || null, admin_replied_at: trimmed ? new Date().toISOString() : null }
          : x
      )
    );
    setOpenReplyId(null);
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
              <Fragment key={r.id}>
                <tr>
                  <td>{r.product_name}</td>
                  <td>{r.reviewer_name}</td>
                  <td>
                    <div style={{ display: "flex", gap: 1 }}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} size={13} fill={i <= r.rating ? "#f59e0b" : "none"} color="#f59e0b" />
                      ))}
                    </div>
                  </td>
                  <td style={{ maxWidth: 260 }}>
                    {r.comment || "—"}
                    {r.admin_reply && (
                      <div style={{ marginTop: 6, padding: "6px 8px", background: "#f0fdf4", borderRadius: 6, fontSize: 12, whiteSpace: "pre-wrap" }}>
                        <b>پاسخ شما:</b> {r.admin_reply}
                      </div>
                    )}
                  </td>
                  <td className="text-xs text-gray-500">{new Date(r.created_at).toLocaleDateString("fa-IR")}</td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => (openReplyId === r.id ? setOpenReplyId(null) : openReplyBox(r))}
                        className="admin-btn admin-btn-secondary"
                      >
                        <MessageCircle size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(r)}
                        disabled={deletingId === r.id}
                        className="admin-btn admin-btn-danger"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
                {openReplyId === r.id && (
                  <tr>
                    <td colSpan={6}>
                      <div className="admin-form-group" style={{ margin: "8px 0" }}>
                        <label>پاسخ ادمین به {r.reviewer_name}</label>
                        <textarea
                          rows={4}
                          value={replyDraft}
                          onChange={(e) => setReplyDraft(e.target.value)}
                          placeholder="پاسخ خود را بنویسید... (اینتر = خط جدید)"
                        />
                      </div>
                      {replyError && <p className="text-red-600 text-xs mb-2">{replyError}</p>}
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => handleSaveReply(r)}
                          disabled={savingReplyId === r.id}
                          className="admin-btn admin-btn-primary"
                        >
                          {savingReplyId === r.id ? "در حال ثبت..." : "ثبت پاسخ"}
                        </button>
                        <button onClick={() => setOpenReplyId(null)} className="admin-btn admin-btn-secondary">
                          انصراف
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
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