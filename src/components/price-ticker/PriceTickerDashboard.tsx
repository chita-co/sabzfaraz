"use client";

import { useEffect, useState } from "react";
import { DollarSign, Coins, Bitcoin, AlertTriangle, Star, Send } from "lucide-react";
import type { PriceCategory, PriceItem, PriceSnapshot } from "@/types/priceTicker";
import TickerMarquee from "./TickerMarquee";
import HeroSpotlight from "./HeroSpotlight";
import PriceChart from "./PriceChart";
import ConverterTools from "./ConverterTools";
import PriceAlertWidget from "./PriceAlertWidget";
import { shareOrFallback } from "./ShareBar";

const POLL_MS = 30_000;
const FAVORITES_KEY = "sabzfaraz_price_favorites";

const TABS: { key: PriceCategory; label: string; icon: typeof DollarSign }[] = [
  { key: "currency", label: "ارز", icon: DollarSign },
  { key: "gold", label: "طلا و سکه", icon: Coins },
  { key: "crypto", label: "ارز دیجیتال", icon: Bitcoin },
];

function loadFavorites(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(JSON.parse(window.localStorage.getItem(FAVORITES_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

function saveFavorites(set: Set<string>) {
  window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(set)));
}

function formatPercent(n: number): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toLocaleString("fa-IR", { maximumFractionDigits: 2 })}٪`;
}

function timeAgoFa(iso: string): string {
  const diffSec = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (diffSec < 5) return "همین الان";
  if (diffSec < 60) return `${diffSec.toLocaleString("fa-IR")} ثانیه پیش`;
  const min = Math.round(diffSec / 60);
  return `${min.toLocaleString("fa-IR")} دقیقه پیش`;
}

export default function PriceTickerDashboard({ initialSnapshot }: { initialSnapshot: PriceSnapshot }) {
  const [snapshot, setSnapshot] = useState<PriceSnapshot>(initialSnapshot);
  const [activeTab, setActiveTab] = useState<PriceCategory>("currency");
  const [selected, setSelected] = useState<PriceItem | null>(initialSnapshot.currency[0] ?? null);
  const [favorites, setFavorites] = useState<Set<string>>(() => loadFavorites());
  const [, forceTick] = useState(0);

  const [renderedSnapshot, setRenderedSnapshot] = useState(initialSnapshot);
  const [prevPricesMap, setPrevPricesMap] = useState<Record<string, number>>({});

  if (snapshot !== renderedSnapshot) {
    const nextPrevPrices: Record<string, number> = {};
    [...renderedSnapshot.currency, ...renderedSnapshot.gold, ...renderedSnapshot.crypto].forEach((i) => {
      nextPrevPrices[i.symbol] = i.price;
    });
    setPrevPricesMap(nextPrevPrices);
    setRenderedSnapshot(snapshot);
  }

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch("/api/price-ticker", { cache: "no-store" });
        const data: PriceSnapshot = await res.json();
        if (!cancelled) setSnapshot(data);
      } catch {
        // شبکه قطع بود؛ در تلاش بعدی دوباره امتحان می‌شود
      }
    }
    const interval = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const t = setInterval(() => forceTick((v) => v + 1), 1000);
    return () => clearInterval(t);
  }, []);

  function toggleFavorite(symbol: string) {
    const next = new Set(favorites);
    if (next.has(symbol)) next.delete(symbol);
    else next.add(symbol);
    setFavorites(next);
    saveFavorites(next);
  }

  const rawItems = snapshot[activeTab];
  const items = [...rawItems].sort((a, b) => {
    const fa = favorites.has(a.symbol) ? 1 : 0;
    const fb = favorites.has(b.symbol) ? 1 : 0;
    return fb - fa;
  });

  const topGainer = rawItems.length > 1 ? rawItems.reduce((a, b) => (b.changePercent > a.changePercent ? b : a)) : null;
  const topLoser = rawItems.length > 1 ? rawItems.reduce((a, b) => (b.changePercent < a.changePercent ? b : a)) : null;

  const allItems = [...snapshot.currency, ...snapshot.gold, ...snapshot.crypto];
  const greenCount = allItems.filter((i) => i.changePercent >= 0).length;
  const marketMoodPercent = allItems.length > 0 ? Math.round((greenCount / allItems.length) * 100) : null;

  function quickShareRow(item: PriceItem) {
    const url = typeof window !== "undefined" ? window.location.href : "https://sabzfaraz.ir/price-ticker";
    const text = `قیمت ${item.name} هم‌اکنون ${item.price.toLocaleString("fa-IR")} ${item.unit ?? "تومان"} است (${formatPercent(item.changePercent)}) — سبزفراز`;
    shareOrFallback({ title: "قیمت لحظه‌ای سبزفراز", text, url }, () => {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, "_blank");
    });
  }

  return (
    <div className="pt-dashboard">
      <TickerMarquee items={allItems} />

      <div className="pt-hero">
        <h1>قیمت لحظه‌ای طلا، دلار و ارز دیجیتال</h1>
        <p className="pt-hero-sub">
          نرخ آنلاین دلار، یورو، سکه، طلای ۱۸ عیار و برترین ارزهای دیجیتال (با منبع CoinGecko) — به‌روزرسانی خودکار
          هر ۳۰ ثانیه، بدون نیاز به رفرش صفحه.
        </p>

        <div className="pt-status-row">
          <span className={`pt-status-dot ${snapshot.stale ? "stale" : "live"}`} />
          <span>{snapshot.stale ? "در حال تلاش برای دریافت آخرین قیمت..." : "زنده"}</span>
          <span className="pt-dot-sep">·</span>
          <span>به‌روزرسانی: {timeAgoFa(snapshot.updatedAt)}</span>
          {snapshot.stale && <AlertTriangle size={14} className="pt-warn-icon" />}
          {marketMoodPercent !== null && (
            <>
              <span className="pt-dot-sep">·</span>
              <span className="pt-mood">
                بازار امروز: <b className={marketMoodPercent >= 50 ? "pos" : "neg"}>{marketMoodPercent.toLocaleString("fa-IR")}٪</b>{" "}
                {marketMoodPercent >= 50 ? "سبز" : "قرمز"}
              </span>
            </>
          )}
        </div>
      </div>

      <HeroSpotlight currency={snapshot.currency} gold={snapshot.gold} crypto={snapshot.crypto} />

      <div className="pt-tabs">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              className={`pt-tab ${activeTab === tab.key ? "active" : ""}`}
              onClick={() => {
                setActiveTab(tab.key);
                setSelected(snapshot[tab.key][0] ?? null);
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="pt-grid">
        <div className="pt-table-wrap">
          {items.length === 0 ? (
            <div className="pt-skeleton-list">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="pt-skeleton-row" />
              ))}
            </div>
          ) : (
            <div className="pt-table">
              {items.map((item) => {
                const prev = prevPricesMap[item.symbol];
                const flash = prev !== undefined && prev !== item.price ? (item.price > prev ? "up" : "down") : "";
                const positive = item.changePercent >= 0;
                const isFav = favorites.has(item.symbol);
                const isGainer = !!topGainer && topGainer.symbol === item.symbol && topGainer.changePercent > 0;
                const isLoser = !!topLoser && topLoser.symbol === item.symbol && topLoser.changePercent < 0;

                return (
                  <div
                    key={item.symbol}
                    className={`pt-row ${selected?.symbol === item.symbol ? "selected" : ""} ${flash}`}
                    onClick={() => setSelected(item)}
                  >
                    <button
                      className={`pt-fav-btn ${isFav ? "active" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(item.symbol);
                      }}
                      aria-label="افزودن به علاقه‌مندی‌ها"
                    >
                      <Star size={14} fill={isFav ? "#fbbf24" : "none"} />
                    </button>

                    <div className="pt-row-name">
                      <span className="pt-row-title">
                        {item.name}
                        {isGainer && <span className="pt-badge up">🔥 پرتغییرترین رشد</span>}
                        {isLoser && <span className="pt-badge down">❄️ بیشترین افت</span>}
                      </span>
                      {item.nameEn && <span className="pt-row-sub">{item.nameEn}</span>}
                    </div>

                    <div className="pt-row-price">
                      <span className="pt-row-price-num">{item.price.toLocaleString("fa-IR")}</span>
                      <span className="pt-row-unit">
                        {item.unit ?? "تومان"}
                        {item.usdPrice !== undefined && ` · $${item.usdPrice.toLocaleString("en-US", { maximumFractionDigits: item.usdPrice < 1 ? 4 : 2 })}`}
                      </span>
                    </div>

                    <div className={`pt-row-change ${positive ? "pos" : "neg"}`}>
                      {positive ? "▲" : "▼"} {formatPercent(Math.abs(item.changePercent)).replace("+", "")}
                    </div>

                    <button
                      className="pt-row-share"
                      onClick={(e) => {
                        e.stopPropagation();
                        quickShareRow(item);
                      }}
                      aria-label="اشتراک‌گذاری این قیمت"
                    >
                      <Send size={13} />
                    </button>

                    {typeof item.bubblePercent === "number" && <div className="pt-row-bubble">حباب: {formatPercent(item.bubblePercent)}</div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="pt-side">
          {selected && <PriceChart category={activeTab} item={selected} />}
          <PriceAlertWidget items={items} />
        </div>
      </div>

      <ConverterTools currencyItems={snapshot.currency} goldItems={snapshot.gold} />

      <style>{`
        .pt-dashboard { background: linear-gradient(135deg, #0f2818 0%, #14532d 45%, #1a4d2e 75%, #3f3010 100%); color:#e5e7eb; padding-bottom: 40px; }
        .pt-hero { max-width: 1100px; margin: 0 auto; text-align: center; padding: 26px 16px 0; }
        .pt-hero h1 { font-size: clamp(22px,4vw,32px); font-weight: 800; color: #fff; margin-bottom: 8px; }
        .pt-hero-sub { color: #d1d5db; font-size: 14px; max-width: 680px; margin: 0 auto; line-height: 1.9; }
        .pt-status-row { display:flex; align-items:center; justify-content:center; gap:8px; margin-top:14px; font-size:12.5px; color:#d1d5db; flex-wrap:wrap; }
        .pt-status-dot { width:8px; height:8px; border-radius:999px; background:#22c55e; box-shadow:0 0 0 3px rgba(34,197,94,.25); }
        .pt-status-dot.stale { background:#f59e0b; box-shadow:0 0 0 3px rgba(245,158,11,.25); }
        .pt-dot-sep { opacity:.5; }
        .pt-warn-icon { color:#f59e0b; }
        .pt-mood b.pos { color:#4ade80; } .pt-mood b.neg { color:#f87171; }

        .pt-tabs { max-width:1100px; margin: 20px auto 14px; padding: 0 16px; display:flex; gap:8px; justify-content:center; flex-wrap:wrap; }
        .pt-tab { display:flex; align-items:center; gap:6px; padding:9px 18px; border-radius:999px; border:1px solid rgba(255,255,255,.1); background:rgba(255,255,255,.05); color:#d1d5db; font-size:13.5px; font-weight:600; cursor:pointer; transition:.15s; }
        .pt-tab:hover { background:rgba(255,255,255,.1); }
        .pt-tab.active { background: linear-gradient(135deg, #16a34a, #ca8a04); color:#fff; border-color: transparent; }

        .pt-grid { max-width:1100px; margin:0 auto; padding: 0 16px; display:grid; grid-template-columns: 1.4fr 1fr; gap:16px; align-items:start; }
        @media (max-width: 860px) { .pt-grid { grid-template-columns: 1fr; } }

        .pt-skeleton-list { display:flex; flex-direction:column; gap:8px; }
        .pt-skeleton-row { height:64px; border-radius:14px; background: linear-gradient(90deg, rgba(255,255,255,.04) 25%, rgba(255,255,255,.09) 37%, rgba(255,255,255,.04) 63%); background-size: 400% 100%; animation: pt-shimmer 1.4s ease infinite; }
        @keyframes pt-shimmer { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }

        .pt-table { display:flex; flex-direction:column; gap:8px; }
        .pt-row { display:grid; grid-template-columns: auto 1.3fr 1.3fr .8fr auto; align-items:center; gap:10px; padding:14px 14px; border-radius:14px; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.08); text-align:right; cursor:pointer; transition: background .5s, border-color .2s; position:relative; }
        .pt-row:hover { border-color: rgba(251,191,36,.4); }
        .pt-row.selected { border-color:#fbbf24; background:rgba(251,191,36,.08); }
        .pt-row.up { background:rgba(34,197,94,.2); }
        .pt-row.down { background:rgba(239,68,68,.2); }
        .pt-fav-btn { background:none; border:none; color:#6b7280; cursor:pointer; padding:4px; display:flex; }
        .pt-fav-btn.active { color:#fbbf24; }
        .pt-row-name { display:flex; flex-direction:column; gap:3px; min-width:0; }
        .pt-row-title { font-weight:700; font-size:14.5px; color:#fff; display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
        .pt-row-sub { font-size:11px; color:#6b7280; }
        .pt-badge { font-size:9.5px; font-weight:700; padding:1px 6px; border-radius:999px; white-space:nowrap; }
        .pt-badge.up { background:rgba(34,197,94,.15); color:#4ade80; }
        .pt-badge.down { background:rgba(239,68,68,.15); color:#f87171; }
        .pt-row-price { display:flex; flex-direction:column; align-items:flex-end; }
        .pt-row-price-num { font-variant-numeric: tabular-nums; font-weight:800; font-size:15.5px; color:#fff; }
        .pt-row-unit { font-size:10px; color:#6b7280; direction:ltr; }
        .pt-row-change { font-weight:800; font-size:13px; text-align:left; white-space:nowrap; }
        .pt-row-change.pos { color:#22c55e; }
        .pt-row-change.neg { color:#ef4444; }
        .pt-row-share { background:rgba(255,255,255,.06); border:none; color:#9ca3af; width:28px; height:28px; border-radius:8px; display:flex; align-items:center; justify-content:center; cursor:pointer; }
        .pt-row-share:hover { background:rgba(255,255,255,.12); color:#fff; }
        .pt-row-bubble { position:absolute; bottom:3px; left:50px; font-size:10px; color:#fbbf24; }

        .pt-side { display:flex; flex-direction:column; gap:14px; }
      `}</style>
    </div>
  );
}
