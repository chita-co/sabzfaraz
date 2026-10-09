"use client";

import { useState } from "react";
import { usePathname } from "next/navigation"; // ← فقط اگر می‌خواهی اطلاعیه‌ها فقط در صفحه‌ی اصلی باشند (راهنما انتهای پیام)

export interface AnnouncementItem {
  key: string;   // "1" یا "2"
  text: string;
  hash: string;  // اثر انگشت متن؛ اگر ادمین متن را عوض کند، اطلاعیه دوباره نمایش داده می‌شود
  bg: string;
  color: string;
}

const COOKIE_DAYS = 30;


// نوشتن کوکی بیرون از کامپوننت (قانون react-hooks/immutability تغییر مقدار سراسری را داخل کامپوننت نمی‌پذیرد)
function saveDismissed(key: string, hash: string) {
  document.cookie = `ann_${key}=${hash}; path=/; max-age=${COOKIE_DAYS * 86400}; samesite=lax`;
}

export default function AnnouncementBar({ items }: { items: AnnouncementItem[] }) {
  const [closed, setClosed] = useState<string[]>([]);
  const pathname = usePathname();
  if (pathname !== "/") return null; // ← فقط صفحه‌ی اصلی

  const visible = items.filter((i) => !closed.includes(i.key));
  if (visible.length === 0) return null;

  function close(item: AnnouncementItem) {
    saveDismissed(item.key, item.hash);
    setClosed((prev) => [...prev, item.key]);
  }

  return (
    // marginBottom منفی، margin-top یک‌سانتی‌متری هدر را خنثی می‌کند؛ پس هدر دقیقاً همان‌جای قبلی می‌ماند
    <div
      role="region"
      aria-label="اطلاعیه"
      style={{ marginBottom: "-1cm", minHeight: "1cm", display: "flex", alignItems: "center" }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1280,
          margin: "0 auto",
          padding: "4px 20px",
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        {visible.map((item) => (
          <div
            key={item.key}
            style={{
              flex: "1 1 320px",
              position: "relative",
              background: item.bg,
              color: item.color,
              borderRadius: 8,
              padding: "5px 32px",
              fontSize: 12.5,
              fontWeight: 700,
              lineHeight: 1.6,
              textAlign: "center",
              fontFamily: '"Vazirmatn", "Tahoma", sans-serif',
              boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
            }}
          >
            {item.text}
            <button
              type="button"
              onClick={() => close(item)}
              aria-label="بستن اطلاعیه"
              style={{
                position: "absolute",
                left: 6,
                top: "50%",
                transform: "translateY(-50%)",
                width: 22,
                height: 22,
                lineHeight: "20px",
                border: "none",
                borderRadius: "50%",
                background: "rgba(0,0,0,0.15)",
                color: item.color,
                fontSize: 14,
                cursor: "pointer",
                padding: 0,
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}