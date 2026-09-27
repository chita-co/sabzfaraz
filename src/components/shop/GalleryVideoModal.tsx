"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { buildEmbedUrl } from "@/lib/unboxing/videoHelpers";

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

interface Props {
  platform: "instagram" | "youtube" | "aparat";
  videoUrl: string;
  videoId: string | null;
  onClose: () => void;
}

export default function GalleryVideoModal({ platform, videoUrl, videoId, onClose }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- برای رفع مشکل هایدریشن پرتال؛ همان الگوی EventModal.tsx
    setMounted(true);
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // ← state جدید برای کنترل اسپینر
  const [igLoading, setIgLoading] = useState(true);

  useEffect(() => {
    if (platform !== "instagram" || !mounted) return;

    function process() {
      window.instgrm?.Embeds.process();
    }

    if (window.instgrm) {
      process();
    } else {
      const existing = document.getElementById("instagram-embed-script");
      if (existing) {
        existing.addEventListener("load", process);
      } else {
        const script = document.createElement("script");
        script.id = "instagram-embed-script";
        script.src = "https://www.instagram.com/embed.js";
        script.async = true;
        script.addEventListener("load", process);
        document.body.appendChild(script);
      }
    }

    // حداقل ۱.۵ ثانیه اسپینر رو نگه‌دار، بعد بررسی کن iframe اومده یا نه
    const MIN_SPINNER_MS = 1500;
    let observer: MutationObserver | null = null;
    let minTimePassed = false;
    let iframeReady = false;

    function tryHide() {
      if (minTimePassed && iframeReady) {
        setIgLoading(false);
      }
    }

    const minTimer = setTimeout(() => {
      minTimePassed = true;
      tryHide();
    }, MIN_SPINNER_MS);

    // MutationObserver برای دیدن اینکه iframe داخل باکس ظاهر شده یا نه
    const container = document.querySelector(".gallery-modal-instagram");
    if (container) {
      if (container.querySelector("iframe")) {
        iframeReady = true;
        tryHide();
      } else {
        observer = new MutationObserver(() => {
          if (container.querySelector("iframe")) {
            iframeReady = true;
            tryHide();
            observer?.disconnect();
          }
        });
        observer.observe(container, { childList: true, subtree: true });
      }
    }

    // محافظ: اگه بعد از ۸ ثانیه iframe نیومد، اسپینر رو مخفی کن (به هر حال پیام "مشاهده در اینستاگرام" می‌مونه)
    const maxTimer = setTimeout(() => setIgLoading(false), 8000);

    return () => {
      clearTimeout(minTimer);
      clearTimeout(maxTimer);
      observer?.disconnect();
    };
  }, [platform, mounted]);

  if (!mounted) return null;

  return createPortal(
    <div className="gallery-modal-overlay" onClick={onClose}>
      <div className="gallery-modal" onClick={(e) => e.stopPropagation()}>
        <button className="gallery-modal-close" onClick={onClose}><X size={18} /></button>

        {platform === "instagram" ? (
  <div className="gallery-modal-instagram">
    {igLoading && (
      <div className="ig-loading-spinner" aria-label="در حال بارگذاری...">
        <div className="ig-spinner-circle" />
        <span>در حال بارگذاری ویدیو...</span>
      </div>
    )}
    <blockquote
      className="instagram-media"
      data-instgrm-permalink={videoUrl}
      data-instgrm-version="14"
      style={{ margin: 0, width: "100%", minWidth: 0, maxWidth: "540px" }}
    >
      <a href={videoUrl} target="_blank" rel="noreferrer" style={{ display: "none" }}>Instagram</a>
    </blockquote>
  </div>
) : (
          <div className="gallery-modal-player">
            {videoId ? (
              <iframe
                src={buildEmbedUrl(platform, videoId)}
                title="ویدیوی گالری"
                allowFullScreen
                loading="lazy"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
              />
            ) : (
              <p style={{ color: "#fff", padding: 20 }}>این ویدیو در دسترس نیست.</p>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}