"use client";

import type { PriceItem } from "@/types/priceTicker";

export default function TickerMarquee({ items }: { items: PriceItem[] }) {
  if (items.length === 0) return null;

  // برای حلقه‌ی بی‌درز، لیست را دوبار پشت سر هم تکرار می‌کنیم
  const loopItems = [...items, ...items];

  return (
    <div className="tm-wrap">
      <div className="tm-track">
        {loopItems.map((item, i) => {
          const positive = item.changePercent >= 0;
          return (
            <span className="tm-item" key={`${item.symbol}-${i}`}>
              <span className="tm-name">{item.name}</span>
              <span className="tm-price">{item.price.toLocaleString("fa-IR")}</span>
              <span className={`tm-change ${positive ? "up" : "down"}`}>
                {positive ? "▲" : "▼"} {Math.abs(item.changePercent).toLocaleString("fa-IR", { maximumFractionDigits: 1 })}٪
              </span>
              <span className="tm-sep">|</span>
            </span>
          );
        })}
      </div>

      <style>{`
        .tm-wrap {
          overflow: hidden;
          background: #08120c;
          border-bottom: 1px solid rgba(255,215,0,.15);
          white-space: nowrap;
          direction: ltr;
        }
        .tm-track {
          display: inline-flex;
          align-items: center;
          padding: 9px 0;
          animation: tm-scroll 55s linear infinite;
        }
        .tm-wrap:hover .tm-track { animation-play-state: paused; }
        .tm-item { display:inline-flex; align-items:center; gap:8px; padding: 0 14px; direction: rtl; }
        .tm-name { font-size: 12px; color: #9ca3af; font-weight: 600; }
        .tm-price { font-size: 12.5px; color: #fff; font-weight: 800; font-variant-numeric: tabular-nums; }
        .tm-change { font-size: 11.5px; font-weight: 800; }
        .tm-change.up { color: #22c55e; }
        .tm-change.down { color: #ef4444; }
        .tm-sep { color: rgba(255,255,255,.15); margin-right: 6px; }
        @keyframes tm-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .tm-track { animation: none; }
        }
      `}</style>
    </div>
  );
}
