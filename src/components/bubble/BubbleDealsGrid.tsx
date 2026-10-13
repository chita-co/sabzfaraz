"use client";

import "./bubble-deals.css";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatBubbleRemaining } from "@/lib/bubble/format";
import BubbleAddToCart from "./BubbleAddToCart";
import type { BubbleItem } from "./types";

const AIR_BUBBLES = Array.from({ length: 16 }, (_, i) => ({
  left: (i * 37) % 100,
  size: 8 + ((i * 13) % 26),
  delay: -((i * 2.3) % 14),
  duration: 9 + ((i * 3.7) % 9),
}));

export default function BubbleDealsGrid({ items }: { items: BubbleItem[] }) {
  const router = useRouter();
  const [now, setNow] = useState<number | null>(null);
  const lastRefresh = useRef(0);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const visible =
    now === null ? items : items.filter((i) => new Date(i.flash_ends_at).getTime() > now);

  useEffect(() => {
    if (now === null) return;
    const hasExpired = items.some((i) => new Date(i.flash_ends_at).getTime() <= now);
    if (hasExpired && now - lastRefresh.current > 30000) {
      lastRefresh.current = now;
      router.refresh();
    }
  }, [now, items, router]);

  return (
    <section className="aquarium" dir="rtl">
      {AIR_BUBBLES.map((b, i) => (
        <span
          key={i}
          aria-hidden
          className="air-bubble"
          style={{
            left: `${b.left}%`,
            width: b.size,
            height: b.size,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.duration}s`,
          }}
        />
      ))}

      <div className="aquarium-scroll">
        {visible.length === 0 ? (
          <p className="aquarium-empty">در حال حاضر محصولی در حباب ارزانی نیست. به زودی برمی‌گردیم 🫧</p>
        ) : (
          <div className="aquarium-grid">
            {visible.map((item, index) => {
              const bubblePrice = item.discount_price ?? item.price;
              const percent = Math.round(100 - (bubblePrice / item.price) * 100);
              const soldOut = item.stock !== null && item.stock <= 0;
              const remaining = now === null ? null : new Date(item.flash_ends_at).getTime() - now;

              return (
                <div
                  key={item.id}
                  className="bubble-card"
                  style={{ animationDelay: `${-(index % 5) * 1.1}s` }}
                >
                  <div className="bubble-tilt">
                    <Link href={`/products/${item.slug}`} prefetch={false} className="bubble-link">
                      <span className="bubble-tag">⚡ حباب ارزانی</span>
                      {percent > 0 && (
                        <span className="bubble-percent">{percent.toLocaleString("fa-IR")}٪-</span>
                      )}

                      <div className="bubble-img">
                        {item.images?.[0] ? (
                          <Image src={item.images[0]} alt={item.name} fill sizes="(max-width: 768px) 60vw, 25vw" />
                        ) : (
                          <span className="flex h-full items-center justify-center text-sm text-gray-400">
                            بدون تصویر
                          </span>
                        )}
                        {soldOut && <div className="bubble-soldout">ناموجود</div>}
                      </div>

                      <h3 className="bubble-name">{item.name}</h3>

                      <div className="bubble-prices">
                        <s>{item.price.toLocaleString("fa-IR")}</s>
                        <strong>
                          {bubblePrice.toLocaleString("fa-IR")} <small>تومان</small>
                        </strong>
                      </div>

                      <div className="bubble-timer">
                        {remaining === null ? "--:--:--" : formatBubbleRemaining(remaining)}
                        <small>باقی‌مانده</small>
                      </div>
                    </Link>

                    <BubbleAddToCart item={item} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}