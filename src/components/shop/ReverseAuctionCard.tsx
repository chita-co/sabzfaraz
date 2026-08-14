"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TrendingDown } from "lucide-react";
import { computeReverseAuctionPrice } from "@/lib/reverseAuction/pricing";

interface Props {
  id: string; title: string; image: string | null; status: string;
  startingPrice: number; floorPrice: number; dropAmount: number; dropIntervalMinutes: number; startsAt: string;
  soldPrice: number | null;
}

export default function ReverseAuctionCard({ id, title, image, status, startingPrice, floorPrice, dropAmount, dropIntervalMinutes, startsAt, soldPrice }: Props) {
  const [price, setPrice] = useState(() =>
    status === "ACTIVE"
      ? computeReverseAuctionPrice({ startingPrice, floorPrice, dropAmount, dropIntervalMinutes, startsAt })
      : (soldPrice ?? startingPrice)
  );

  useEffect(() => {
    if (status !== "ACTIVE") return;
    const timer = setInterval(() => {
      setPrice(computeReverseAuctionPrice({ startingPrice, floorPrice, dropAmount, dropIntervalMinutes, startsAt }));
    }, 1000);
    return () => clearInterval(timer);
  }, [status, startingPrice, floorPrice, dropAmount, dropIntervalMinutes, startsAt]);

  return (
    <Link href={`/reverse-auctions/${id}`} className="group block overflow-hidden rounded-2xl border border-white/10 bg-white/5 hover:border-amber-400 transition">
      <div className="relative aspect-square bg-gray-800">
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition" />
        )}
        <span className={`absolute top-2 right-2 badge ${status === "ACTIVE" ? "badge-success" : status === "SOLD" ? "badge-warning" : "badge-danger"}`}>
          {status === "ACTIVE" ? "در حال کاهش قیمت" : status === "SOLD" ? "فروخته شد" : "پایان یافته"}
        </span>
      </div>
      <div className="p-3">
        <p className="text-sm text-white line-clamp-2 mb-2">{title}</p>
        <p className="text-amber-400 font-bold text-base flex items-center gap-1">
          <TrendingDown size={14} /> {price.toLocaleString("fa-IR")} تومان
        </p>
        {status === "ACTIVE" && <p className="text-xs text-gray-400 mt-1">قیمت هر {dropIntervalMinutes.toLocaleString("fa-IR")} دقیقه کاهش می‌یابد</p>}
      </div>
    </Link>
  );
}