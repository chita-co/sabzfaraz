"use client";

import { useState, useEffect } from "react";
import { PlayCircle } from "lucide-react";
import UnboxingVideoModal from "./UnboxingVideoModal";
import { detectPreferredPlatform } from "@/lib/unboxing/detectPlatformAccess";

interface Props {
  id: string; title: string;
  aparatId: string | null; youtubeId: string | null; instagramUrl: string | null;
  thumbnailUrl: string | null; customerName: string | null; orderNumber?: string | null;
  isFeatured?: boolean;
}

export default function UnboxingVideoCard({ title, aparatId, youtubeId, instagramUrl, thumbnailUrl, customerName, orderNumber, isFeatured }: Props) {
  const [open, setOpen] = useState(false);
  const [preferredPlatform, setPreferredPlatform] = useState<"aparat" | "youtube">("aparat");

  useEffect(() => {
    detectPreferredPlatform().then(setPreferredPlatform);
  }, []);

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
          <span className="unboxing-play-icon"><PlayCircle size={40} /></span>
          <div className="unboxing-card-platforms">
            {aparatId && <span className="unboxing-platform-dot aparat" title="آپارات" />}
            {youtubeId && <span className="unboxing-platform-dot youtube" title="یوتیوب" />}
            {instagramUrl && <span className="unboxing-platform-dot instagram" title="اینستاگرام" />}
          </div>
        </div>
        <div className="unboxing-card-body">
          <p className="unboxing-card-title">{title}</p>
          {customerName && <p className="unboxing-card-customer">آنباکس مشتری خوبمون: {customerName}</p>}
          {orderNumber && <p className="unboxing-card-order" dir="ltr">#{orderNumber}</p>}
        </div>
      </button>

      {open && (
        <UnboxingVideoModal
          title={title}
          links={{ aparatId, youtubeId, instagramUrl }}
          preferredPlatform={preferredPlatform}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}