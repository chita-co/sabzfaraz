"use client";

import Image from "next/image";
import { useState } from "react";
import { Check, X, Star, Trash2, Wallet, CreditCard } from "lucide-react";
import { approveAndPublish, rejectVideo, toggleFeatured, deleteUnboxingVideo } from "@/app/admin/unboxing/actions";

interface VideoRow {
  id: string; title: string; platform: string; thumbnail_url: string | null;
  customer_name: string | null; order_number: string | null; status: string;
  reward_amount: number; reward_paid: boolean; is_featured: boolean;
  aparat_video_id: string | null; youtube_video_id: string | null; instagram_url: string | null;
  product: { name: string } | null;
}

const statusLabels: Record<string, string> = { PENDING: "در انتظار", PUBLISHED: "منتشرشده", REJECTED: "رد‌شده" };
const statusBadge: Record<string, string> = { PENDING: "badge badge-warning", PUBLISHED: "badge badge-success", REJECTED: "badge badge-danger" };

export default function UnboxingVideosTable({ videos }: { videos: VideoRow[] }) {
  const [rows, setRows] = useState(videos);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  async function handleApprove(id: string, method: "wallet" | "manual") {
    setApprovingId(null);
    const result = await approveAndPublish(id, method);
    if (result?.error) alert(result.error);
    else setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: "PUBLISHED", reward_paid: true } : r)));
  }

  async function handleReject(id: string) {
    if (!confirm("آیا از رد این ویدیو مطمئن هستید؟")) return;
    const result = await rejectVideo(id);
    if (!result?.error) setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: "REJECTED" } : r)));
  }

  async function handleFeature(id: string, current: boolean) {
    await toggleFeatured(id, !current);
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, is_featured: !current } : r)));
  }

  async function handleDelete(id: string) {
    if (!confirm("آیا از حذف این ویدیو مطمئن هستید؟")) return;
    const result = await deleteUnboxingVideo(id);
    if (!result?.error) setRows((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="admin-card">
      <table className="admin-table">
        <thead>
          <tr><th>تصویر</th><th>عنوان</th><th>مشتری</th><th>محصول</th><th>وضعیت</th><th>پاداش</th><th></th></tr>
        </thead>
        <tbody>
          {rows.map((v) => (
            <tr key={v.id}>
              <td>
                {v.thumbnail_url ? (
                  <Image
                    src={v.thumbnail_url}
                    alt=""
                    width={64}
                    height={40}
                    className="object-cover rounded-lg"
                    unoptimized
                  />
                ) : (
                  <div className="w-16 h-10 bg-gray-100 rounded-lg" />
                )}
              </td>
              <td>
                {v.title} {v.is_featured && <span className="badge badge-warning" style={{ marginRight: 6 }}>برتر ماه</span>}
                <div className="flex gap-1 mt-1">
                  {v.aparat_video_id && <span className="badge badge-info">آپارات</span>}
                  {v.youtube_video_id && <span className="badge badge-danger">یوتیوب</span>}
                  {v.instagram_url && <span className="badge badge-warning">اینستاگرام</span>}
                </div>
              </td>
              <td>{v.customer_name ?? "—"} {v.order_number && <div className="text-xs text-gray-400" dir="ltr">{v.order_number}</div>}</td>
              <td>{v.product?.name ?? "—"}</td>
              <td><span className={statusBadge[v.status]}>{statusLabels[v.status]}</span></td>
              <td>{v.reward_amount.toLocaleString("fa-IR")} {v.reward_paid && <span className="text-green-600 text-xs"> (پرداخت‌شده)</span>}</td>
              <td>
                <div className="flex gap-1 flex-wrap">
                  {v.status === "PENDING" && (
                    <>
                      {approvingId === v.id ? (
                        <>
                          <button onClick={() => handleApprove(v.id, "wallet")} className="admin-btn admin-btn-primary flex items-center gap-1"><Wallet size={13} /> کیف پول</button>
                          <button onClick={() => handleApprove(v.id, "manual")} className="admin-btn admin-btn-secondary flex items-center gap-1"><CreditCard size={13} /> پرداخت دستی</button>
                        </>
                      ) : (
                        <button onClick={() => setApprovingId(v.id)} className="admin-btn admin-btn-primary flex items-center gap-1"><Check size={13} /> تأیید و واریز</button>
                      )}
                      <button onClick={() => handleReject(v.id)} className="admin-btn admin-btn-danger"><X size={13} /></button>
                    </>
                  )}
                  {v.status === "PUBLISHED" && (
                    <button onClick={() => handleFeature(v.id, v.is_featured)} className="admin-btn admin-btn-secondary">
                      <Star size={13} fill={v.is_featured ? "#f59e0b" : "none"} color="#f59e0b" />
                    </button>
                  )}
                  <button onClick={() => handleDelete(v.id)} className="admin-btn admin-btn-danger"><Trash2 size={13} /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p className="text-gray-500 text-sm text-center py-6">ویدیویی ثبت نشده.</p>}
    </div>
  );
}