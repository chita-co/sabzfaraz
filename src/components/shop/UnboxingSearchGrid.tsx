"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import UnboxingVideoCard from "./UnboxingVideoCard";

interface Video {
  id: string; title: string; customer_name: string | null; order_number: string | null;
  aparat_video_id: string | null; youtube_video_id: string | null; instagram_url: string | null;
  thumbnail_url: string | null; is_featured: boolean;
}

export default function UnboxingSearchGrid({ videos }: { videos: Video[] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!q.trim()) return videos;
    const term = q.trim();
    return videos.filter((v) =>
      v.title.includes(term) ||
      (v.customer_name && v.customer_name.includes(term)) ||
      (v.order_number && v.order_number.includes(term))
    );
  }, [q, videos]);

  return (
    <div>
      <div className="unboxing-search-box">
        <Search size={16} />
        <input
          type="text"
          placeholder="جستجوی ویدیوی خودت: اسم، محصول یا شماره سفارش..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <p className="text-sm text-gray-300 mb-4">{filtered.length.toLocaleString("fa-IR")} ویدیو یافت شد</p>

      {filtered.length > 0 ? (
        <div className="unboxing-grid">
          {filtered.map((v) => (
            <UnboxingVideoCard
              key={v.id} id={v.id} title={v.title}
              aparatId={v.aparat_video_id} youtubeId={v.youtube_video_id} instagramUrl={v.instagram_url}
              thumbnailUrl={v.thumbnail_url} customerName={v.customer_name} orderNumber={v.order_number}
              isFeatured={v.is_featured}
            />
          ))}
        </div>
      ) : (
        <p className="text-gray-400 text-sm text-center py-10">ویدیویی با این مشخصات پیدا نشد.</p>
      )}
    </div>
  );
}