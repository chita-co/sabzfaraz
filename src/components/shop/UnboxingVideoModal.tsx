"use client";

import { X } from "lucide-react";
import { buildEmbedUrl } from "@/lib/unboxing/videoHelpers";

export default function UnboxingVideoModal({
  platform, videoId, title, onClose,
}: { platform: "aparat" | "youtube"; videoId: string; title: string; onClose: () => void }) {
  return (
    <div className="unboxing-modal-overlay" onClick={onClose}>
      <div className="unboxing-modal" onClick={(e) => e.stopPropagation()}>
        <button className="unboxing-modal-close" onClick={onClose}><X size={20} /></button>
        <div className="unboxing-modal-player">
          <iframe
            src={buildEmbedUrl(platform, videoId)}
            title={title}
            allowFullScreen
            loading="lazy"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
          />
        </div>
        <div className="unboxing-modal-share">
          <a href={`https://wa.me/?text=${encodeURIComponent(title + " - " + window.location.href)}`} target="_blank" rel="noreferrer">اشتراک در واتساپ</a>
          <a href={`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(title)}`} target="_blank" rel="noreferrer">اشتراک در تلگرام</a>
        </div>
      </div>
    </div>
  );
}