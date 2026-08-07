"use client";

import { useState } from "react";
import { PlayCircle } from "lucide-react";
import UnboxingVideoModal from "./UnboxingVideoModal";

interface Props {
  id: string; title: string; platform: "aparat" | "youtube"; videoId: string;
  thumbnailUrl: string | null; customerName: string | null; isFeatured?: boolean;
}

export default function UnboxingVideoCard({ title, platform, videoId, thumbnailUrl, customerName, isFeatured }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="unboxing-card" onClick={() => setOpen(true)}>
        <div className="unboxing-card-thumb">
          {thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumbnailUrl} alt={title} loading="lazy" />
          ) : (
            <div className="unboxing-card-thumb-fallback" />
          )}
          {isFeatured && <span className="unboxing-featured-badge">🏆 برتر ماه</span>}
          <span className="unboxing-play-icon"><PlayCircle size={44} /></span>
        </div>
        <div className="unboxing-card-body">
          <p className="unboxing-card-title">{title}</p>
          {customerName && <p className="unboxing-card-customer">ارسال‌شده توسط {customerName}</p>}
        </div>
      </button>

      {open && <UnboxingVideoModal platform={platform} videoId={videoId} title={title} onClose={() => setOpen(false)} />}
    </>
  );
}