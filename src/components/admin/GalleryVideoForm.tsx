"use client";

import { useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { createGalleryVideo } from "@/app/admin/gallery/actions";

// کوچک‌کردن عکس در مرورگر قبل از آپلود (سقف حجم Vercel و سرعت بیشتر)
async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1000 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("خطا در پردازش تصویر"))), "image/jpeg", 0.85)
  );
}

export default function GalleryVideoForm() {
  const [platform, setPlatform] = useState<"instagram" | "youtube" | "aparat">("instagram");
  const [link, setLink] = useState("");
  const [caption, setCaption] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleCoverSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const blob = await compressImage(file);
      const fd = new FormData();
      fd.append("file", blob, "cover.jpg");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "خطا در آپلود تصویر");
      setCoverImageUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در آپلود تصویر");
    } finally {
      setUploading(false);
    }
  }

  function removeCover() {
    if (coverImageUrl) {
      fetch("/api/admin/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: coverImageUrl }),
      }).catch(() => {});
    }
    setCoverImageUrl("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const result = await createGalleryVideo({ platform, link, caption, coverImageUrl });
    setSaving(false);
    if (result?.error) { setError(result.error); return; }
    setLink("");
    setCaption("");
    setCoverImageUrl("");
  }

  return (
    <form onSubmit={handleSubmit} className="admin-card" style={{ maxWidth: 560 }}>
      <h1 className="text-xl font-bold text-gray-900 mb-6">افزودن ویدیو به گالری</h1>

      <div className="admin-form-group">
        <label>پلتفرم</label>
        <select value={platform} onChange={(e) => setPlatform(e.target.value as typeof platform)}>
          <option value="instagram">اینستاگرام</option>
          <option value="youtube">یوتیوب</option>
          <option value="aparat">آپارات</option>
        </select>
      </div>

      <div className="admin-form-group">
        <label>{platform === "instagram" ? "لینک پست/ریلز اینستاگرام" : platform === "youtube" ? "لینک یا شناسه ویدیوی یوتیوب" : "لینک یا شناسه ویدیوی آپارات"}</label>
        <input
          type="text" dir="ltr" value={link} onChange={(e) => setLink(e.target.value)}
          placeholder={platform === "instagram" ? "https://www.instagram.com/reel/..." : "لینک کامل یا شناسه ویدیو"}
          required
        />
      </div>

      {platform !== "instagram" ? (
        <div className="admin-form-group">
          <label>کپشن (اختیاری)</label>
          <input type="text" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="توضیح کوتاه زیر ویدیو" />
        </div>
      ) : (
        <p className="text-xs text-gray-500 mb-2">برای اینستاگرام نیازی به کپشن نیست؛ کپشن واقعی پست خودکار نمایش داده می‌شود.</p>
      )}

      <div className="admin-form-group">
        <label>تصویر کاور (اختیاری{platform === "instagram" ? " — برای نمایش تصویر واقعی به‌جای تایل رنگی" : " — اگر خالی بماند، تصویر خودکار همان پلتفرم استفاده می‌شود"})</label>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleCoverSelect} style={{ display: "none" }} />
        {coverImageUrl ? (
          <div style={{ position: "relative", width: 120, height: 120 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverImageUrl} alt="کاور" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 10, border: "1px solid #e5e7eb" }} />
            <button
              type="button"
              onClick={removeCover}
              style={{ position: "absolute", top: -8, left: -8, width: 24, height: 24, borderRadius: "50%", background: "#dc2626", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            style={{ width: 120, height: 120, border: "2px dashed #d1d5db", borderRadius: 10, background: "#f9fafb", color: "#6b7280", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, fontSize: 12 }}
          >
            {uploading ? "در حال آپلود..." : (<><Plus size={28} /><span>افزودن تصویر</span></>)}
          </button>
        )}
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <button type="submit" disabled={saving || uploading} className="admin-btn admin-btn-primary">
        {saving ? "در حال ثبت..." : "افزودن به گالری"}
      </button>
    </form>
  );
}