"use client";

// ویجت کوچک و اختیاری برای صفحه اصلی (ایده‌ی شماره ۳ از بخش «خفن‌سازی» بریف):
// یک باکس کوچک از قیمت‌های کلیدی که کاربر را به صفحه‌ی کامل قیمت لحظه‌ای دعوت می‌کند.
// این کامپوننت به‌صورت پیش‌فرض در هیچ صفحه‌ای import نشده — طبق درخواست، به فایل‌های
// دیگر پروژه دست نزدیم. برای فعال‌سازی، فقط کافی‌ست طبق INTEGRATION.md آن را در
// src/app/(shop)/page.tsx وارد و رندر کنید.

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { PriceSnapshot } from "@/types/priceTicker";

const HOME_PAGE_URL = "/قیمت-لحظه-ای-طلا-دلار";

export default function HomePriceWidget() {
  const [snapshot, setSnapshot] = useState<PriceSnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/price-ticker", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled) setSnapshot(data);
      } catch {
        // بی‌صدا نادیده گرفته می‌شود؛ این فقط یک ویجت تزئینی است
      }
    }
    load();
    const interval = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (!snapshot) return null;

  const usd = snapshot.currency.find((i) => i.symbol.toUpperCase() === "USD") ?? snapshot.currency[0];
  const gold18 = snapshot.gold.find((g) => g.name.includes("۱۸")) ?? snapshot.gold[0];
  const btc = snapshot.crypto.find((c) => c.symbol === "BTC") ?? snapshot.crypto[0];
  const featured = [usd, gold18, btc].filter(Boolean);
  if (featured.length === 0) return null;

  return (
    <Link href={HOME_PAGE_URL} className="hpw-wrap">
      <span className="hpw-label">قیمت لحظه‌ای</span>
      <div className="hpw-items">
        {featured.map((item) => {
          if (!item) return null;
          const positive = item.changePercent >= 0;
          return (
            <span key={item.symbol} className="hpw-item">
              <span className="hpw-name">{item.name}</span>
              <span className="hpw-price">{item.price.toLocaleString("fa-IR")}</span>
              <span className={`hpw-change ${positive ? "pos" : "neg"}`}>
                {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {Math.abs(item.changePercent).toLocaleString("fa-IR", { maximumFractionDigits: 1 })}٪
              </span>
            </span>
          );
        })}
      </div>

      <style>{`
        .hpw-wrap { display:flex; align-items:center; gap:14px; flex-wrap:wrap; background: linear-gradient(135deg, #14532d 0%, #166534 55%, #854d0e 100%); border-radius:14px; padding:10px 16px; text-decoration:none; }
        .hpw-label { font-size:12px; font-weight:700; color:#fbbf24; flex-shrink:0; }
        .hpw-items { display:flex; gap:16px; flex-wrap:wrap; }
        .hpw-item { display:flex; align-items:center; gap:6px; font-size:12px; color:#e5e7eb; }
        .hpw-name { color:#94a3b8; }
        .hpw-price { font-weight:700; font-variant-numeric: tabular-nums; }
        .hpw-change { display:flex; align-items:center; gap:2px; font-weight:700; }
        .hpw-change.pos { color:#22c55e; }
        .hpw-change.neg { color:#ef4444; }
      `}</style>
    </Link>
  );
}
