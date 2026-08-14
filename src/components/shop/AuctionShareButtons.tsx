"use client";

import { useState } from "react";
import { Share2, Send, MessageCircle, Copy, Check } from "lucide-react";

export default function AuctionShareButtons({ title, path }: { title: string; path: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}${path}` : path;
  const text = `مزایده «${title}» را در سبزفراز ببینید:`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400 flex items-center gap-1"><Share2 size={13} /> اشتراک‌گذاری:</span>
      <a href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer" className="share-icon-btn" title="تلگرام"><Send size={15} /></a>
      <a href={`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`} target="_blank" rel="noreferrer" className="share-icon-btn" title="واتساپ"><MessageCircle size={15} /></a>
      <button onClick={handleCopy} className="share-icon-btn" title="کپی لینک (برای اینستاگرام)">
        {copied ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
      </button>
    </div>
  );
}