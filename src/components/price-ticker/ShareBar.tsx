"use client";

import { useState } from "react";
import { Share2, Send, Link2, Check } from "lucide-react";

interface ShareBarProps {
  title: string;
  text: string;
  url: string;
}

export function shareOrFallback(payload: ShareBarProps, onNoNativeShare: () => void) {
  if (typeof navigator !== "undefined" && navigator.share) {
    navigator.share(payload).catch(() => {
      /* کاربر از دیالوگ اشتراک‌گذاری انصراف داد — نیازی به کار خاصی نیست */
    });
  } else {
    onNoNativeShare();
  }
}

export default function ShareBar({ title, text, url }: ShareBarProps) {
  const [copied, setCopied] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* در مرورگرهای قدیمی clipboard API ممکن است در دسترس نباشد — بی‌خطر نادیده گرفته می‌شود */
    }
  }

  return (
    <div className="sb-wrap">
      <button className="sb-main" onClick={() => shareOrFallback({ title, text, url }, () => setShowFallback((v) => !v))}>
        <Share2 size={15} /> اشتراک‌گذاری قیمت‌ها
      </button>

      {showFallback && (
        <div className="sb-fallback">
          <a href={telegramUrl} target="_blank" rel="noopener noreferrer" className="sb-icon telegram" aria-label="اشتراک در تلگرام">
            <Send size={14} />
          </a>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="sb-icon whatsapp" aria-label="اشتراک در واتساپ">
            <Share2 size={14} />
          </a>
          <button className="sb-icon copy" onClick={copyLink} aria-label="کپی لینک">
            {copied ? <Check size={14} /> : <Link2 size={14} />}
          </button>
        </div>
      )}

      <style>{`
        .sb-wrap { position: relative; display:inline-flex; }
        .sb-main {
          display:flex; align-items:center; gap:6px;
          background: linear-gradient(135deg, #16a34a, #ca8a04);
          color:#fff; border:none; border-radius:999px; padding:9px 16px;
          font-size:12.5px; font-weight:700; cursor:pointer;
        }
        .sb-fallback {
          position:absolute; top: calc(100% + 8px); inset-inline-start:0;
          display:flex; gap:6px; background:#111827; border:1px solid rgba(255,255,255,.1);
          border-radius:12px; padding:6px; z-index:20;
        }
        .sb-icon { width:32px; height:32px; border-radius:9px; display:flex; align-items:center; justify-content:center; color:#fff; border:none; cursor:pointer; }
        .sb-icon.telegram { background:#229ed9; }
        .sb-icon.whatsapp { background:#25d366; }
        .sb-icon.copy { background:#374151; }
      `}</style>
    </div>
  );
}
