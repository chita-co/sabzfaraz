"use client";

// افکت فصلی پشت جدول تقویم.
// تصویر بک‌گراند هر فصل را در مسیر زیر قرار دهید (فقط همین چهار اسم دقیق):
//   public/calendar/season-spring.jpg   (بهار)
//   public/calendar/season-summer.jpg   (تابستان)
//   public/calendar/season-autumn.jpg   (پاییز)
//   public/calendar/season-winter.jpg   (زمستان)
// اگر تصویری نگذارید، فقط گرادیان رنگی متناسب با فصل نمایش داده می‌شود —
// یعنی چیزی خراب نمی‌شود، فقط عکس نداریم.

import { useEffect, useMemo, useState } from "react";
import { toJalali } from "@/lib/calendar/jalali";

type Season = "spring" | "summer" | "autumn" | "winter";

function getSeason(jm: number): Season {
  if (jm >= 1 && jm <= 3) return "spring";
  if (jm >= 4 && jm <= 6) return "summer";
  if (jm >= 7 && jm <= 9) return "autumn";
  return "winter";
}

const SEASON_META: Record<Season, { emoji: string[]; gradient: string; image: string }> = {
  spring: { emoji: ["🌸", "🌷", "🌼"], gradient: "linear-gradient(160deg, #14532d 0%, #3f6b3f 55%, #a3a847 100%)", image: "/calendar/season-spring.jpg" },
  summer: { emoji: ["✨", "☀️", "✦"], gradient: "linear-gradient(160deg, #14532d 0%, #7a5b12 55%, #ca8a04 100%)", image: "/calendar/season-summer.jpg" },
  autumn: { emoji: ["🍂", "🍁", "🍃"], gradient: "linear-gradient(160deg, #14532d 0%, #7a3b12 55%, #b45309 100%)", image: "/calendar/season-autumn.jpg" },
  winter: { emoji: ["❄️", "❅", "❆"], gradient: "linear-gradient(160deg, #0f2818 0%, #1e3a5f 55%, #3f5470 100%)", image: "/calendar/season-winter.jpg" },
};

interface Particle {
  id: number;
  left: number;
  duration: number;
  delay: number;
  size: number;
  symbol: string;
  drift: number;
}

function buildParticles(symbols: string[], count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    duration: 8 + Math.random() * 10,
    delay: Math.random() * 12,
    size: 12 + Math.random() * 14,
    symbol: symbols[i % symbols.length],
    drift: (Math.random() - 0.5) * 80,
  }));
}

export default function SeasonalBackground({ date }: { date: Date }) {
  const [imageOk, setImageOk] = useState(true);
  const season = useMemo(() => getSeason(toJalali(date).jm), [date]);
  const meta = SEASON_META[season];
  const particles = useMemo(() => buildParticles(meta.emoji, season === "winter" ? 34 : 22), [season, meta.emoji]);

  useEffect(() => {
    setImageOk(true);
  }, [season]);

  return (
    <div className="seasonal-bg" aria-hidden="true">
      <div className="seasonal-gradient" style={{ background: meta.gradient }} />
      {imageOk && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={meta.image} alt="" className="seasonal-image" onError={() => setImageOk(false)} />
      )}
      <div className="seasonal-particles">
        {particles.map((p) => (
          <span
            key={p.id}
            className="seasonal-particle"
            style={{
              left: `${p.left}%`,
              fontSize: p.size,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              // @ts-expect-error -- CSS custom property
              "--drift": `${p.drift}px`,
            }}
          >
            {p.symbol}
          </span>
        ))}
      </div>

      <style jsx>{`
        .seasonal-bg { position: absolute; inset: 0; overflow: hidden; z-index: 0; pointer-events: none; }
        .seasonal-gradient { position: absolute; inset: 0; opacity: .85; }
        .seasonal-image { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: .35; mix-blend-mode: soft-light; }
        .seasonal-particles { position: absolute; inset: 0; }
        .seasonal-particle {
          position: absolute;
          top: -40px;
          opacity: .85;
          animation-name: seasonal-fall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          filter: drop-shadow(0 0 3px rgba(0,0,0,.2));
        }
        @keyframes seasonal-fall {
          0%   { transform: translateY(-5vh) translateX(0) rotate(0deg); opacity: 0; }
          10%  { opacity: .9; }
          100% { transform: translateY(105vh) translateX(var(--drift)) rotate(340deg); opacity: .2; }
        }
        @media (prefers-reduced-motion: reduce) {
          .seasonal-particle { animation: none; display: none; }
        }
      `}</style>
    </div>
  );
}
