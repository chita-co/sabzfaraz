"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Banner } from "@/types";

export default function BannerCarousel({
  banners,
  height = 200,
  altPrefix = "بنر تبلیغاتی",
}: {
  banners: Banner[];
  height?: number;
  altPrefix?: string;
}) {
  const [index, setIndex] = useState(0);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % banners.length);
  }, [banners.length]);

  const prev = () => setIndex((i) => (i - 1 + banners.length) % banners.length);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(next, 3500);
    return () => clearInterval(timer);
  }, [next, banners.length]);

  if (banners.length === 0) return null;

  return (
    <div
      className="promo-banner-section"
      style={{ position: "relative", width: "100%", height, overflow: "hidden", borderRadius: 14 }}
    >
      {banners.map((b, i) => {
        const inner = (
          <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={b.image_url}
              alt={`${altPrefix} - اسلاید ${i + 1}`}
              loading={i === 0 ? "eager" : "lazy"}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        );
        return (
          <div
            key={b.id}
            style={{
              position: "absolute", inset: 0,
              opacity: i === index ? 1 : 0,
              transition: "opacity 0.7s ease",
              pointerEvents: i === index ? "auto" : "none",
              zIndex: i === index ? 2 : 1,
            }}
          >
            {b.link_url ? (
              <Link href={b.link_url} style={{ display: "block", width: "100%", height: "100%" }}>{inner}</Link>
            ) : inner}
          </div>
        );
      })}

      {banners.length > 1 && (
        <>
          <button onClick={prev} style={{ position: "absolute", top: "50%", right: 12, transform: "translateY(-50%)", background: "rgba(255,255,255,0.85)", border: "none", width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#15803d", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", zIndex: 5 }}>
            <ChevronRight size={16} />
          </button>
          <button onClick={next} style={{ position: "absolute", top: "50%", left: 12, transform: "translateY(-50%)", background: "rgba(255,255,255,0.85)", border: "none", width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#15803d", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", zIndex: 5 }}>
            <ChevronLeft size={16} />
          </button>
          <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6, zIndex: 5 }}>
            {banners.map((_, i) => (
              <button key={i} onClick={() => setIndex(i)} style={{ width: i === index ? 16 : 6, height: 6, borderRadius: 999, background: i === index ? "#fff" : "rgba(255,255,255,0.6)", border: "none", cursor: "pointer", transition: "width 0.2s" }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}