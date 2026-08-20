"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { TrendingDown, Clock, ShoppingBag, Info } from "lucide-react";
import { computeReverseAuctionPrice, nextPriceDropAt } from "@/lib/reverseAuction/pricing";
import { buyReverseAuctionNow, getReverseAuctionLiveState } from "@/app/(shop)/reverse-auctions/actions";
import AuctionShareButtons from "./AuctionShareButtons";
import "./auction-detail.css";

interface ReverseAuction {
  id: string; title: string; description: string; images: string[];
  starting_price: number; floor_price: number; drop_amount: number; drop_interval_minutes: number;
  shipping_cost: number; starts_at: string; ends_at: string | null; rules_text: string | null; status: string;
}

const statusColor: Record<string, string> = {
  ACTIVE: "#f59e0b", UPCOMING: "#3b82f6", SOLD: "#9ca3af", ENDED_UNSOLD: "#6b7280", CANCELLED: "#dc2626",
};
const statusLabel: Record<string, string> = {
  ACTIVE: "در حال کاهش قیمت", UPCOMING: "به‌زودی شروع می‌شود", SOLD: "فروخته شد", ENDED_UNSOLD: "بدون خریدار", CANCELLED: "لغو شده",
};

export default function ReverseAuctionDetailClient({
  auction, isLoggedIn, isWinner,
}: { auction: ReverseAuction; isLoggedIn: boolean; isWinner: boolean }) {
  const [activeImage, setActiveImage] = useState(0);
  const [status, setStatus] = useState(auction.status);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // مقدار زمان فقط بعد از mount مقداردهی می‌شود تا خطای Hydration (که قبلاً برای مزایده هم داشتیم) پیش نیاید
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
  const initialTimer = setTimeout(() => setNow(Date.now()), 0);
  const timer = setInterval(() => setNow(Date.now()), 1000);
  return () => {
    clearTimeout(initialTimer);
    clearInterval(timer);
  };
}, []);

  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const poll = useCallback(async () => {
    const state = await getReverseAuctionLiveState(auction.id);
    setStatus(state.status);
  }, [auction.id]);
  useEffect(() => {
    pollRef.current = setInterval(poll, 6000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [poll]);

  const isActive = status === "ACTIVE" && now !== null && new Date(auction.starts_at).getTime() <= now;
  const currentPrice = now && isActive
    ? computeReverseAuctionPrice({
        startingPrice: auction.starting_price, floorPrice: auction.floor_price,
        dropAmount: auction.drop_amount, dropIntervalMinutes: auction.drop_interval_minutes, startsAt: auction.starts_at,
        now: new Date(now),
      })
    : auction.starting_price;
  const atFloor = currentPrice <= auction.floor_price;
  const nextDrop = now && isActive && !atFloor
    ? nextPriceDropAt({ dropIntervalMinutes: auction.drop_interval_minutes, startsAt: auction.starts_at, now: new Date(now) })
    : null;
  const secondsToDrop = nextDrop && now ? Math.max(0, Math.round((nextDrop.getTime() - now) / 1000)) : 0;

  async function handleBuy() {
    setError(null);
    if (!isLoggedIn) { window.location.href = "/login"; return; }
    if (!confirm(`آیا از خرید این کالا به قیمت ${currentPrice.toLocaleString("fa-IR")} تومان مطمئن هستید؟ این قیمت فقط برای شما و در همین لحظه رزرو می‌شود.`)) return;
    setBuying(true);
    const result = await buyReverseAuctionNow(auction.id);
    setBuying(false);
    if (result?.error) { setError(result.error); return; }
    window.location.href = `/reverse-auctions/${auction.id}/pay`;
  }

  return (
    <div className="ad-wrap">
      <div className="ad-grid">
        <div className="ad-gallery">
          <div className="ad-gallery-main">
            {auction.images?.[activeImage] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={auction.images[activeImage]} alt={auction.title} />
            ) : (
              <div className="ad-gallery-no-image">بدون تصویر</div>
            )}
          </div>
          {auction.images && auction.images.length > 1 && (
            <div className="ad-thumbs">
              {auction.images.map((img, i) => (
                <button key={i} className={`ad-thumb${i === activeImage ? " active" : ""}`} onClick={() => setActiveImage(i)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="ad-info">
          <div className="ad-title-row">
            <h1 className="ad-title">{auction.title}</h1>
            <span className="ad-status-badge" style={{ background: statusColor[status] ?? "#6b7280" }}>{statusLabel[status] ?? status}</span>
          </div>

          <div className="ad-share-row">
            <AuctionShareButtons title={auction.title} path={`/reverse-auctions/${auction.id}`} />
          </div>

          {isWinner && status === "SOLD" && (
            <p className="ad-success">
              🎉 شما این کالا را خریداری کردید! برای تکمیل خرید <a href={`/reverse-auctions/${auction.id}/pay`} style={{ textDecoration: "underline" }}>اینجا</a> کلیک کنید.
            </p>
          )}

          {isActive && !atFloor && nextDrop && (
            <div className="ad-countdown-card">
              <div className="ad-countdown-label"><Clock size={15} /> کاهش قیمت بعدی تا</div>
              <div className="ad-countdown-value">
                <span className="ad-countdown-time" dir="ltr">
                  {String(Math.floor(secondsToDrop / 60)).padStart(2, "0")}:{String(secondsToDrop % 60).padStart(2, "0")}
                </span>
              </div>
            </div>
          )}

          <div className="ad-price-card">
            <div className="ad-price-label">
              {isActive ? (atFloor ? "قیمت نهایی (به کف رسیده)" : "قیمت لحظه‌ای — در حال کاهش") : status === "SOLD" ? "این کالا فروخته شده است" : "قیمت شروع"}
            </div>
            <div className="ad-price-value" style={{ color: isActive ? "#fbbf24" : "#4ade80" }}>
              {(isActive ? currentPrice : auction.starting_price).toLocaleString("fa-IR")}<small>تومان</small>
            </div>
          </div>

          <div className="ad-stats-row">
            <span className="ad-stat"><TrendingDown size={14} /> کاهش هر بار: <b>{auction.drop_amount.toLocaleString("fa-IR")}</b> تومان</span>
            <span className="ad-stat"><Clock size={14} /> هر <b>{auction.drop_interval_minutes.toLocaleString("fa-IR")}</b> دقیقه</span>
          </div>

          <div className="ad-entry-fee-box" style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <Info size={15} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>
              قیمت این کالا هر {auction.drop_interval_minutes.toLocaleString("fa-IR")} دقیقه به‌طور خودکار {auction.drop_amount.toLocaleString("fa-IR")} تومان کاهش می‌یابد تا به کف قیمت برسد.
              اولین کسی که دکمه‌ی «خرید فوری» را بزند، کالا را با همان قیمت لحظه‌ای می‌برد — بدون نیاز به پیشنهاد قیمت یا پرداخت هزینه‌ی شرکت.
            </span>
          </div>

          {error && <p className="ad-error">{error}</p>}

          {!isLoggedIn ? (
            <a href="/login" className="ad-cta-btn">ورود برای خرید</a>
          ) : !isActive ? (
            <div className="ad-disabled-note">
              {status === "UPCOMING" ? "این حراج هنوز شروع نشده است." : status === "SOLD" ? "این کالا قبلاً فروخته شده است." : "این حراج بدون خریدار به پایان رسیده است."}
            </div>
          ) : (
            <button onClick={handleBuy} disabled={buying} className="ad-cta-btn">
              <ShoppingBag size={18} /> {buying ? "در حال ثبت..." : `خرید فوری به قیمت ${currentPrice.toLocaleString("fa-IR")} تومان`}
            </button>
          )}

          <div className="ad-section">
            <h3 className="ad-section-title">توضیحات محصول</h3>
            <p className="ad-section-text">{auction.description}</p>
          </div>

          {auction.rules_text && (
            <div className="ad-section">
              <h3 className="ad-section-title">قوانین این حراج</h3>
              <p className="ad-section-text">{auction.rules_text}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}