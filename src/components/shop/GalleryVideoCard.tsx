"use client";

import { useState } from "react";
import { PlayCircle } from "lucide-react";
import GalleryVideoModal from "./GalleryVideoModal";

interface Props {
  platform: "instagram" | "youtube" | "aparat";
  videoUrl: string;
  videoId: string | null;
  caption: string | null;
  coverImageUrl: string | null;
}

export default function GalleryVideoCard({ platform, videoUrl, videoId, caption, coverImageUrl }: Props) {
  const [open, setOpen] = useState(false);

  const autoThumbnail =
    platform === "youtube" && videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    : platform === "aparat" && videoId ? `https://static.cdn.asset.aparat.com/avt/${videoId}.jpg`
    : null;

  const thumbnailUrl = coverImageUrl || autoThumbnail;

  return (
    <>
      <button className="gallery-card" onClick={() => setOpen(true)}>
        <div className="gallery-card-thumb">
          {thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumbnailUrl} alt={caption ?? "ویدیو"} loading="lazy" />
          ) : (
            <div className="gallery-card-instagram-tile">اینستاگرام</div>
          )}
          <span className="gallery-play-icon"><PlayCircle size={36} /></span>
        </div>
        {caption && <p className="gallery-card-caption">{caption}</p>}
      </button>

      {open && (
        <GalleryVideoModal platform={platform} videoUrl={videoUrl} videoId={videoId} onClose={() => setOpen(false)} />
      )}
    </>
  );
}