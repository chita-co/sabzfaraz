"use client";
import Link from "next/link";
import toast from "react-hot-toast";
import { UserPlus, Handshake, PackageSearch, Scale } from "lucide-react";
import LivePriceBadge from "./LivePriceBadge";
import type { HeaderPriceSummary } from "@/lib/priceTicker/headerSummary";

export default function TopBar({ isLoggedIn, prices }: { isLoggedIn: boolean; prices?: HeaderPriceSummary }) {
  return (
    <div className="site-topbar">
      <div className="site-topbar-inner">
        <div className="topbar-actions">
          {!isLoggedIn && (
            <Link href="/login" className="topbar-btn">
              <UserPlus size={14} /> ورود / ثبت‌نام
            </Link>
          )}
          <Link href="/partner/login" className="topbar-btn">
            <Handshake size={14} /> ورود همکاران
          </Link>
          <Link href="/profile/orders" className="topbar-btn">
            <PackageSearch size={14} /> پیگیری سفارشتان
          </Link>
          <button
            type="button"
            className="topbar-btn"
            onClick={() => toast("این قابلیت به‌زودی اضافه می‌شود.")}
          >
            <Scale size={14} /> لیست مقایسه
          </button>
        </div>

        {prices && (prices.usd || prices.gold18k || prices.bitcoin) && (
          <Link href="/price-ticker" className="topbar-deals">
            {prices.usd && <LivePriceBadge label="دلار" price={prices.usd.price} changePercent={prices.usd.changePercent} colorVar="1" />}
            {prices.gold18k && <LivePriceBadge label="طلای ۱۸ عیار" price={prices.gold18k.price} changePercent={prices.gold18k.changePercent} colorVar="2" />}
            {prices.bitcoin && <LivePriceBadge label="بیت‌کوین" price={prices.bitcoin.price} changePercent={prices.bitcoin.changePercent} unit="تومان" colorVar="3" />}
          </Link>
        )}
      </div>

      <style jsx>{`
        .site-topbar {
          background: linear-gradient(135deg, #14532d 0%, #166534 55%, #854d0e 100%);
          border-bottom: 1px solid rgba(255, 215, 0, 0.2);
        }
        .site-topbar-inner {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 8px 20px;
          flex-wrap: wrap;
        }
        .topbar-actions {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }
        .topbar-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11.5px;
          font-weight: 700;
          padding: 7px 16px;
          border-radius: 999px;
          border: none;
          cursor: pointer;
          white-space: nowrap;
          background: linear-gradient(135deg, #ffd700, #eab308);
          color: #14532d;
          box-shadow: 0 2px 8px rgba(234, 179, 8, 0.35);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .topbar-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(234, 179, 8, 0.5);
        }

        :global(.topbar-deals) {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }
        :global(.price-badge) {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
          color: #fff;
          white-space: nowrap;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        :global(.price-badge:hover) {
          transform: translateY(-1px);
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
        }
        :global(.price-badge-c1) { background: rgba(22, 163, 74, 0.35); border: 1px solid #16a34a; }
        :global(.price-badge-c2) { background: rgba(234, 179, 8, 0.3); border: 1px solid #eab308; }
        :global(.price-badge-c3) { background: rgba(74, 222, 128, 0.25); border: 1px solid #4ade80; }
        :global(.price-badge-label) { opacity: 0.9; }
        :global(.price-badge-value b) { font-weight: 500; font-size: 10px; opacity: 0.85; }
        :global(.price-badge-change) {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          font-size: 10px;
          font-weight: 700;
          border-radius: 6px;
          padding: 1px 5px;
        }
        :global(.price-badge-change.up) { background: rgba(74, 222, 128, 0.25); color: #4ade80; }
        :global(.price-badge-change.down) { background: rgba(248, 113, 113, 0.25); color: #f87171; }

        @media (max-width: 1024px) {
          .site-topbar { display: none; }
        }
      `}</style>
    </div>
  );
}