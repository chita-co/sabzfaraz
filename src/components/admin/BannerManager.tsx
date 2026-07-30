// src/components/admin/BannerManager.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { Upload, Trash2, Loader2 } from "lucide-react";
import {
  createBanner,
  toggleBannerActive,
  deleteBanner,
} from "@/app/admin/banners/actions";
import { Banner } from "@/types";

export default function BannerManager({ banners }: { banners: Banner[] }) {
  const [uploading, setUploading] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) {
        await createBanner(data.url, linkUrl, Number(sortOrder) || 0);
        setLinkUrl("");
      } else {
        alert(data.error || "خطا در آپلود");
      }
    } catch {
      alert("خطا در ارتباط با سرور");
    }
    setUploading(false);
    e.target.value = "";
  }

  async function handleDelete(b: Banner) {
    if (!confirm("آیا از حذف این بنر مطمئن هستید؟")) return;
    setDeletingId(b.id);
    await deleteBanner(b.id, b.image_url);
    setDeletingId(null);
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-5">مدیریت بنرهای اسلایدی</h1>

      <div className="admin-card mb-5">
        <h2 className="font-bold text-gray-800 mb-3">افزودن بنر جدید</h2>
        <div className="grid sm:grid-cols-3 gap-3 mb-3">
          <input
            type="text"
            placeholder="لینک مقصد (اختیاری)"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className="admin-input"
          />
          <input
            type="number"
            placeholder="ترتیب نمایش"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="admin-input"
          />
        </div>
        <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg py-4 cursor-pointer text-sm text-gray-500 hover:border-green-500 hover:text-green-600">
          {uploading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> در حال آپلود...
            </>
          ) : (
            <>
              <Upload size={16} /> انتخاب تصویر بنر
            </>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>تصویر</th>
              <th>لینک</th>
              <th>ترتیب</th>
              <th>وضعیت</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {banners.map((b) => (
              <tr key={b.id}>
                <td>
                  <Image
                    src={b.image_url}
                    alt=""
                    width={96}
                    height={48}
                    sizes="96px"
                    className="object-cover rounded-lg"
                    unoptimized
                  />
                </td>
                <td dir="ltr" className="text-left text-xs">
                  {b.link_url || "—"}
                </td>
                <td>{b.sort_order}</td>
                <td>
                  <button
                    className={
                      b.is_active
                        ? "admin-btn admin-btn-primary"
                        : "admin-btn admin-btn-secondary"
                    }
                    onClick={() => toggleBannerActive(b.id, !b.is_active)}
                  >
                    {b.is_active ? "فعال" : "غیرفعال"}
                  </button>
                </td>
                <td>
                  <button
                    className="admin-btn admin-btn-danger"
                    onClick={() => handleDelete(b)}
                    disabled={deletingId === b.id}
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {banners.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-6">هنوز بنری ثبت نشده.</p>
        )}
      </div>
    </div>
  );
}