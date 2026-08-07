"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface VideoLinks {
  aparatId: string | null;
  youtubeId: string | null;
  instagramUrl: string | null;
}

export default function UnboxingVideoModal({
  title, links, preferredPlatform, onClose,
}: { title: string; links: VideoLinks; preferredPlatform: "aparat" | "youtube"; onClose: () => void }) {
  const initialTab: "aparat" | "youtube" | "instagram" =
    links.aparatId && preferredPlatform === "aparat" ? "aparat"
    : links.youtubeId ? "youtube"
    : links.aparatId ? "aparat" : "instagram";

  const [activeTab, setActiveTab] = useState<"aparat" | "youtube" | "instagram">(initialTab);

  return (
    <div className="unboxing-modal-overlay" onClick={onClose}>
      <div className="unboxing-modal" onClick={(e) => e.stopPropagation()}>
        <button className="unboxing-modal-close" onClick={onClose}><X size={20} /></button>

        <div className="unboxing-modal-tabs">
          {links.aparatId && (
            <button className={`unboxing-tab-btn${activeTab === "aparat" ? " active" : ""}`} onClick={() => setActiveTab("aparat")}>آپارات</button>
          )}
          {links.youtubeId && (
            <button className={`unboxing-tab-btn${activeTab === "youtube" ? " active" : ""}`} onClick={() => setActiveTab("youtube")}>یوتیوب</button>
          )}
          {links.instagramUrl && (
            <button className={`unboxing-tab-btn${activeTab === "instagram" ? " active" : ""}`} onClick={() => setActiveTab("instagram")}>اینستاگرام</button>
          )}
        </div>

        <div className="unboxing-modal-player">
          {activeTab === "aparat" && links.aparatId && (
            <iframe src={`https://www.aparat.com/video/video/embed/videohash/${links.aparatId}/vt/frame`} title={title} allowFullScreen loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }} />
          )}
          {activeTab === "youtube" && links.youtubeId && (
            <iframe src={`https://www.youtube.com/embed/${links.youtubeId}`} title={title} allowFullScreen loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }} />
          )}
          {activeTab === "instagram" && links.instagramUrl && (
            <div className="unboxing-instagram-fallback">
              <p>این ویدیو در اینستاگرام قابل مشاهده است.</p>
              <a href={links.instagramUrl} target="_blank" rel="noreferrer">مشاهده در اینستاگرام ↗</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}