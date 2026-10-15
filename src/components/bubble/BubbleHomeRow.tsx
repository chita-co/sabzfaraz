"use client";

import "./bubble-deals.css";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatBubbleRemaining } from "@/lib/bubble/format";
import BubbleAddToCart from "./BubbleAddToCart";
import type { BubbleItem } from "./types";
import DragScrollRow from "@/components/shared/DragScrollRow";

export default function BubbleHomeRow({ items }: { items: BubbleItem[] }) {
  const router = useRouter();
  const [now, setNow] = useState<number | null>(null);
  const lastRefresh = useRef(0);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (now === null) return;
    const hasExpired = items.some((i) => new Date(i.flash_ends_at).getTime() <= now);
    if (hasExpired && now - lastRefresh.current > 30000) {
      lastRefresh.current = now;
      router.refresh();
    }
  }, [now, items, router]);

  const visible =
    now === null ? items : items.filter((i) => new Date(i.flash_ends_at).getTime() > now);

  if (visible.length === 0) return null;

  return (
    <section className="bubble-home-section mx-auto max-w-7xl px-4 py-6" dir="rtl">
      <div className="bubble-home-head">
        <h2 className="bubble-section-title">🫧 حباب ارزانی</h2>
        <Link href="/bubble-deals" className="deal-see-all">
          مشاهده همه
        </Link>
      </div>

      <div className="aquarium-row">

        <DragScrollRow className="aquarium-scroll">
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
                          <Image src={item.images[0]} alt={item.name} fill sizes="260px" />
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
                        <strong className="bubble-price-fire">
                          {bubblePrice.toLocaleString("fa-IR")} <small>تومان</small>
                        </strong>
                      </div>

                      <div className="bubble-hype">
                        🔥 فرصت داری این محصول را خیلی ارزون‌تر بخری؛ فرصت را از دست نده!
                      </div>

                      <div className="bubble-timer">
                        {remaining === null ? "--:--:--" : formatBubbleRemaining(remaining)}
                        <small>باقی‌مانده</small>
                      </div>
                    </Link>

                    {item.flash_stock !== null && item.flash_stock !== undefined && item.flash_stock > 0 && (
                    <div className="bubble-left">فقط {item.flash_stock.toLocaleString("fa-IR")} عدد با این قیمت</div>
                  )}

                    <BubbleAddToCart item={item} />
                  </div>
                </div>
              );
            })}
          </div>
        </DragScrollRow>
      </div>
    </section>
  );
}