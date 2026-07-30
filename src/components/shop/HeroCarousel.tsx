"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Banner } from "@/types";

export default function HeroCarousel({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % banners.length);
  }, [banners.length]);

  const prev = () => setIndex((i) => (i - 1 + banners.length) % banners.length);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(next, 3000);
    return () => clearInterval(timer);
  }, [next, banners.length]);

  if (banners.length === 0) return null;

  return (
    <div style={{ position: "relative", width: "100%", height: 380, overflow: "hidden", background: "#0f0f0f" }}>
      {banners.map((b, i) => {
        const content = (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={b.image_url}
            alt=""
            loading={i === 0 ? "eager" : "lazy"}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        );
        return (
          <div
            key={b.id}
            style={{
              position: "absolute",
              inset: 0,
              opacity: i === index ? 1 : 0,
              transition: "opacity 0.7s ease",
              pointerEvents: i === index ? "auto" : "none",
              zIndex: i === index ? 2 : 1,
            }}
          >
            {b.link_url ? (
              <Link href={b.link_url} style={{ display: "block", width: "100%", height: "100%" }}>
                {content}
              </Link>
            ) : (
              content
            )}
          </div>
        );
      })}

      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            style={{
              position: "absolute", top: "50%", right: 14, transform: "translateY(-50%)",
              background: "rgba(255,255,255,0.85)", border: "none", width: 36, height: 36,
              borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#15803d", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", zIndex: 5,
            }}
          >
            <ChevronRight size={20} />
          </button>
          <button
            onClick={next}
            style={{
              position: "absolute", top: "50%", left: 14, transform: "translateY(-50%)",
              background: "rgba(255,255,255,0.85)", border: "none", width: 36, height: 36,
              borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#15803d", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", zIndex: 5,
            }}
          >
            <ChevronLeft size={20} />
          </button>
          <div
            style={{
              position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
              display: "flex", gap: 6, zIndex: 5,
            }}
          >
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                style={{
                  width: i === index ? 20 : 8, height: 8, borderRadius: 999,
                  background: i === index ? "#fff" : "rgba(255,255,255,0.6)",
                  border: "none", cursor: "pointer", transition: "width 0.2s",
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}