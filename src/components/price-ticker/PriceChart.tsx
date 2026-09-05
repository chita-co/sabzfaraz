"use client";

import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { PriceCategory, PriceHistoryPoint, PriceItem } from "@/types/priceTicker";
import ShareBar from "./ShareBar";

const RANGES = [
  { key: 24, label: "۲۴ ساعت" },
  { key: 24 * 7, label: "۷ روز" },
];

function findNearest(points: PriceHistoryPoint[], targetMs: number): PriceHistoryPoint | null {
  if (points.length === 0) return null;
  return points.reduce((best, p) => {
    const diff = Math.abs(new Date(p.t).getTime() - targetMs);
    const bestDiff = Math.abs(new Date(best.t).getTime() - targetMs);
    return diff < bestDiff ? p : best;
  }, points[0]);
}

function deltaPercent(from: number, to: number): number {
  if (!from) return 0;
  return ((to - from) / from) * 100;
}

export default function PriceChart({ category, item }: { category: PriceCategory; item: PriceItem }) {
  const [hours, setHours] = useState(24);
  const [points, setPoints] = useState<PriceHistoryPoint[]>([]);
  const [weekPoints, setWeekPoints] = useState<PriceHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/price-ticker/history?category=${category}&symbol=${encodeURIComponent(item.symbol)}&hours=${hours}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setPoints(d.points ?? []);
      })
      .catch(() => {
        if (!cancelled) setPoints([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [category, item.symbol, hours]);

  // یک درخواست جدا و ساکت فقط برای جدول مقایسه‌ای (صرف‌نظر از بازه‌ی انتخابی نمودار)
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/price-ticker/history?category=${category}&symbol=${encodeURIComponent(item.symbol)}&hours=${24 * 7}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setWeekPoints(d.points ?? []);
      })
      .catch(() => {
        if (!cancelled) setWeekPoints([]);
      });
    return () => {
      cancelled = true;
    };
  }, [category, item.symbol]);

  const chartData = points.map((p) => ({
    time: new Date(p.t).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }),
    price: p.price,
  }));

  const trendUp = chartData.length > 1 && chartData[chartData.length - 1].price >= chartData[0].price;

  const now = Date.now();
  const yesterdayPoint = findNearest(weekPoints, now - 24 * 60 * 60 * 1000);
  const weekAgoPoint = weekPoints[0] ?? null;

  const shareUrl = typeof window !== "undefined" ? window.location.href : "https://sabzfaraz.ir/قیمت-لحظه-ای-طلا-دلار";
  const shareText = `قیمت ${item.name} هم‌اکنون ${item.price.toLocaleString("fa-IR")} ${item.unit ?? "تومان"} است (${item.changePercent >= 0 ? "+" : ""}${item.changePercent.toLocaleString("fa-IR", { maximumFractionDigits: 1 })}٪) — سبزفراز`;

  return (
    <div className="pt-chart-card">
      <div className="pt-chart-head">
        <div>
          <div className="pt-chart-title">{item.name}</div>
          <div className="pt-chart-price">
            {item.price.toLocaleString("fa-IR")} <span>{item.unit ?? "تومان"}</span>
          </div>
        </div>
        <div className="pt-range-switch">
          {RANGES.map((r) => (
            <button key={r.key} className={hours === r.key ? "active" : ""} onClick={() => setHours(r.key)}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-chart-body">
        {loading ? (
          <div className="pt-chart-loading">در حال بارگذاری نمودار...</div>
        ) : chartData.length < 2 ? (
          <div className="pt-chart-loading">هنوز داده‌ی کافی برای این بازه ثبت نشده — نمودار به‌مرور با بازدیدهای بعدی کامل می‌شود.</div>
        ) : (
          <ResponsiveContainer width="100%" height={170}>
            <AreaChart data={chartData} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="pt-area-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={trendUp ? "#22c55e" : "#ef4444"} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={trendUp ? "#22c55e" : "#ef4444"} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} minTickGap={30} />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fontSize: 10, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
                width={54}
                tickFormatter={(v: number) => v.toLocaleString("fa-IR")}
              />
              <Tooltip
                contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, fontSize: 12 }}
                labelStyle={{ color: "#9ca3af" }}
                formatter={(value: number | string) => [`${Number(value).toLocaleString("fa-IR")} ${item.unit ?? "تومان"}`, "قیمت"]}
              />
              <Area type="monotone" dataKey="price" stroke={trendUp ? "#22c55e" : "#ef4444"} strokeWidth={2} fill="url(#pt-area-fill)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {(yesterdayPoint || weekAgoPoint) && (
        <div className="pt-compare">
          <div className="pt-compare-cell">
            <span>امروز</span>
            <strong>{item.price.toLocaleString("fa-IR")}</strong>
          </div>
          {yesterdayPoint && (
            <div className="pt-compare-cell">
              <span>دیروز</span>
              <strong>{yesterdayPoint.price.toLocaleString("fa-IR")}</strong>
              <em className={deltaPercent(yesterdayPoint.price, item.price) >= 0 ? "pos" : "neg"}>
                {deltaPercent(yesterdayPoint.price, item.price) >= 0 ? "+" : ""}
                {deltaPercent(yesterdayPoint.price, item.price).toLocaleString("fa-IR", { maximumFractionDigits: 1 })}٪
              </em>
            </div>
          )}
          {weekAgoPoint && (
            <div className="pt-compare-cell">
              <span>هفته پیش</span>
              <strong>{weekAgoPoint.price.toLocaleString("fa-IR")}</strong>
              <em className={deltaPercent(weekAgoPoint.price, item.price) >= 0 ? "pos" : "neg"}>
                {deltaPercent(weekAgoPoint.price, item.price) >= 0 ? "+" : ""}
                {deltaPercent(weekAgoPoint.price, item.price).toLocaleString("fa-IR", { maximumFractionDigits: 1 })}٪
              </em>
            </div>
          )}
        </div>
      )}

      <div className="pt-chart-footer">
        <ShareBar title="قیمت لحظه‌ای سبزفراز" text={shareText} url={shareUrl} />
      </div>

      <style>{`
        .pt-chart-card { background: rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.08); border-radius:18px; padding:16px; }
        .pt-chart-head { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:8px; }
        .pt-chart-title { font-size:13px; color:#9ca3af; margin-bottom:4px; }
        .pt-chart-price { font-size:20px; font-weight:800; color:#fff; }
        .pt-chart-price span { font-size:11px; color:#6b7280; font-weight:400; margin-right:4px; }
        .pt-range-switch { display:flex; gap:4px; background:rgba(255,255,255,.05); border-radius:999px; padding:3px; }
        .pt-range-switch button { border:none; background:transparent; color:#9ca3af; font-size:11.5px; padding:5px 10px; border-radius:999px; cursor:pointer; }
        .pt-range-switch button.active { background:#fbbf24; color:#111827; font-weight:700; }
        .pt-chart-loading { display:flex; align-items:center; justify-content:center; height:150px; color:#6b7280; font-size:12.5px; text-align:center; padding: 0 20px; }
        .pt-compare { display:grid; grid-template-columns: repeat(3, 1fr); gap:8px; margin-top:14px; }
        .pt-compare-cell { background:rgba(255,255,255,.04); border-radius:10px; padding:8px; text-align:center; display:flex; flex-direction:column; gap:2px; }
        .pt-compare-cell span { font-size:10.5px; color:#6b7280; }
        .pt-compare-cell strong { font-size:12.5px; color:#e5e7eb; font-variant-numeric: tabular-nums; }
        .pt-compare-cell em { font-size:10.5px; font-style:normal; font-weight:700; }
        .pt-compare-cell em.pos { color:#22c55e; }
        .pt-compare-cell em.neg { color:#ef4444; }
        .pt-chart-footer { margin-top:14px; display:flex; justify-content:flex-end; }
      `}</style>
    </div>
  );
}
