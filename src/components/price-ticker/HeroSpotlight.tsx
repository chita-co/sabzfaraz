"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import InlineSparkline from "./InlineSparkline";
import type { PriceCategory, PriceItem } from "@/types/priceTicker";

interface SpotlightSlot {
  category: PriceCategory;
  item: PriceItem;
}

function useSparkline(category: PriceCategory, symbol: string) {
  const [points, setPoints] = useState<number[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/price-ticker/history?category=${category}&symbol=${encodeURIComponent(symbol)}&hours=24`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setPoints((d.points ?? []).map((p: { price: number }) => p.price));
      })
      .catch(() => {
        if (!cancelled) setPoints([]);
      });
    return () => {
      cancelled = true;
    };
  }, [category, symbol]);
  return points;
}

function SpotlightCard({ category, item }: SpotlightSlot) {
  const points = useSparkline(category, item.symbol);
  const positive = item.changePercent >= 0;

  return (
    <div className={`spot-card ${positive ? "up" : "down"}`}>
      <div className="spot-top">
        <span className="spot-name">{item.name}</span>
        <span className={`spot-badge ${positive ? "up" : "down"}`}>
          {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(item.changePercent).toLocaleString("fa-IR", { maximumFractionDigits: 1 })}٪
        </span>
      </div>
      <div className="spot-mid">
        <span className="spot-price">{item.price.toLocaleString("fa-IR")}</span>
        <span className="spot-unit">{item.unit ?? "تومان"}</span>
      </div>
      <div className="spot-spark">
        <InlineSparkline points={points} positive={positive} width={120} height={36} />
      </div>

      <style>{`
        .spot-card {
          background: rgba(255,255,255,.06);
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 18px;
          padding: 16px 18px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          position: relative;
          overflow: hidden;
        }
        .spot-card::before {
          content: "";
          position: absolute;
          inset-inline-start: 0;
          top: 0;
          bottom: 0;
          width: 4px;
        }
        .spot-card.up::before { background: linear-gradient(180deg, #22c55e, #16a34a); }
        .spot-card.down::before { background: linear-gradient(180deg, #f87171, #ef4444); }
        .spot-top { display: flex; align-items: center; justify-content: space-between; }
        .spot-name { font-size: 13px; color: #d1d5db; font-weight: 600; }
        .spot-badge { display:flex; align-items:center; gap:3px; font-size:11.5px; font-weight:800; padding: 2px 8px; border-radius: 999px; }
        .spot-badge.up { color:#22c55e; background: rgba(34,197,94,.12); }
        .spot-badge.down { color:#ef4444; background: rgba(239,68,68,.12); }
        .spot-mid { display:flex; align-items:baseline; gap:6px; }
        .spot-price { font-size: 24px; font-weight: 900; color: #fff; font-variant-numeric: tabular-nums; }
        .spot-unit { font-size: 11px; color: #9ca3af; }
        .spot-spark { align-self: flex-end; margin-top: -4px; }
      `}</style>
    </div>
  );
}

export default function HeroSpotlight({ currency, gold, crypto }: { currency: PriceItem[]; gold: PriceItem[]; crypto: PriceItem[] }) {
  const usd = currency.find((i) => i.symbol.toUpperCase() === "USD") ?? currency[0];
  const gold18 = gold.find((g) => g.name.includes("۱۸")) ?? gold[0];
  const btc = crypto.find((c) => c.symbol === "BTC") ?? crypto[0];

  const slots: SpotlightSlot[] = [
    usd && { category: "currency" as const, item: usd },
    gold18 && { category: "gold" as const, item: gold18 },
    btc && { category: "crypto" as const, item: btc },
  ].filter(Boolean) as SpotlightSlot[];

  if (slots.length === 0) return null;

  return (
    <div className="spot-grid">
      {slots.map((slot) => (
        <SpotlightCard key={slot.item.symbol} {...slot} />
      ))}
      <style>{`
        .spot-grid { max-width:1100px; margin: 18px auto 0; display:grid; grid-template-columns: repeat(3, 1fr); gap:12px; }
        @media (max-width: 720px) { .spot-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
