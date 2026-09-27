"use client";

import { useState } from "react";
import { createGalleryVideo } from "@/app/admin/gallery/actions";

export default function GalleryVideoForm() {
  const [platform, setPlatform] = useState<"instagram" | "youtube" | "aparat">("instagram");
  const [link, setLink] = useState("");
  const [caption, setCaption] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
        <label>لینک تصویر کاور (اختیاری{platform === "instagram" ? " — برای نمایش تصویر واقعی به‌جای تایل رنگی" : " — اگر خالی بماند، تصویر خودکار همان پلتفرم استفاده می‌شود"})</label>
        <input type="text" dir="ltr" value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} placeholder="https://..." />
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <button type="submit" disabled={saving} className="admin-btn admin-btn-primary">
        {saving ? "در حال ثبت..." : "افزودن به گالری"}
      </button>
    </form>
  );
}