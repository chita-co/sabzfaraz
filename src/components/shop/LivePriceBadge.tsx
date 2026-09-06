"use client";
import { TrendingUp, TrendingDown } from "lucide-react";

interface LivePriceBadgeProps {
  label: string;
  price: number;
  changePercent?: number;
  unit?: string;
  colorVar: "1" | "2" | "3";
}

export default function LivePriceBadge({ label, price, changePercent, unit = "تومان", colorVar }: LivePriceBadgeProps) {
  const isUp = (changePercent ?? 0) >= 0;
  return (
    <div className={`price-badge price-badge-c${colorVar}`}>
      <span className="price-badge-label">{label}</span>
      <span className="price-badge-value">
        {price.toLocaleString("fa-IR")} <b>{unit}</b>
      </span>
      {typeof changePercent === "number" && changePercent !== 0 && (
        <span className={`price-badge-change ${isUp ? "up" : "down"}`}>
          {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {Math.abs(changePercent).toLocaleString("fa-IR", { maximumFractionDigits: 1 })}٪
        </span>
      )}
    </div>
  );
}