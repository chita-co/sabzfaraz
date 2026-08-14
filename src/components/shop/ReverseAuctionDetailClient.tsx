"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { TrendingDown, Clock, ShoppingBag } from "lucide-react";
import { computeReverseAuctionPrice, nextPriceDropAt } from "@/lib/reverseAuction/pricing";
import { buyReverseAuctionNow, getReverseAuctionLiveState } from "@/app/(shop)/reverse-auctions/actions";
import AuctionShareButtons from "./AuctionShareButtons";

interface ReverseAuction {
  id: string; title: string; description: string; images: string[];
  starting_price: number; floor_price: number; drop_amount: number; drop_interval_minutes: number;
  shipping_cost: number; starts_at: string; ends_at: string | null; rules_text: string | null; status: string;
}

export default function ReverseAuctionDetailClient({
  auction, isLoggedIn, isWinner,
}: { auction: ReverseAuction; isLoggedIn: boolean; isWinner: boolean }) {
  const [activeImage, setActiveImage] = useState(0);
  const [status, setStatus] = useState(auction.status);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState<string | null>(null);
    const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
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

  const isActive = status === "ACTIVE" && new Date(auction.starts_at) <= new Date();
  const currentPrice = isActive
    ? computeReverseAuctionPrice({
        startingPrice: auction.starting_price, floorPrice: auction.floor_price,
        dropAmount: auction.drop_amount, dropIntervalMinutes: auction.drop_interval_minutes, startsAt: auction.starts_at,
      })
    : auction.starting_price;
  const atFloor = currentPrice <= auction.floor_price;
  const nextDrop = isActive && !atFloor
    ? nextPriceDropAt({ dropIntervalMinutes: auction.drop_interval_minutes, startsAt: auction.starts_at })
    : null;
  const secondsToDrop = nextDrop && now !== null ? Math.max(0, Math.round((nextDrop.getTime() - now) / 1000)) : 0;

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
    <div className="product-page">
      <div className="product-card">
        <div className="product-gallery">
          <div className="product-gallery-main">
            {auction.images?.[activeImage] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={auction.images[activeImage]} alt={auction.title} />
            ) : (
              <div className="product-no-image">بدون تصویر</div>
            )}
          </div>
          {auction.images && auction.images.length > 1 && (
            <div className="product-thumbs">
              {auction.images.map((img, i) => (
                <button key={i} className={`product-thumb${i === activeImage ? " active" : ""}`} onClick={() => setActiveImage(i)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="product-info">
          <div className="product-name-row">
            <h1 className="product-title">{auction.title}</h1>
            <span className="product-badge-new" style={{ background: isActive ? "#f59e0b" : status === "SOLD" ? "#9ca3af" : "#6b7280" }}>
              {isActive ? "در حال کاهش قیمت" : status === "SOLD" ? "فروخته شد" : status === "UPCOMING" ? "به‌زودی شروع می‌شود" : "پایان یافته"}
            </span>
          </div>

          <div className="mb-3"><AuctionShareButtons title={auction.title} path={`/reverse-auctions/${auction.id}`} /></div>

          {isWinner && status === "SOLD" && (
            <div className="points-earn-badge" style={{ marginBottom: 12 }}>
              🎉 شما این کالا را خریداری کردید! برای تکمیل خرید <a href={`/reverse-auctions/${auction.id}/pay`} className="text-green-700 underline">اینجا</a> کلیک کنید.
            </div>
          )}

          {isActive ? (
            <div className="product-price-block">
              <div className="price-lowest">
                <h1 className="flex items-center gap-2"><TrendingDown size={22} className="text-amber-500" /> {currentPrice.toLocaleString("fa-IR")} <span>تومان</span></h1>
              </div>
              <p className="price-lowest-note">
                {atFloor ? "قیمت به کف رسیده و دیگر کاهش نمی‌یابد" : `هر ${auction.drop_interval_minutes.toLocaleString("fa-IR")} دقیقه، ${auction.drop_amount.toLocaleString("fa-IR")} تومان کاهش می‌یابد`}
              </p>
              {nextDrop && !atFloor && (
                <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                  <Clock size={12} /> کاهش قیمت بعدی تا {Math.floor(secondsToDrop / 60)}:{String(secondsToDrop % 60).padStart(2, "0")} دیگر
                </p>
              )}
            </div>
          ) : (
            <div className="product-price-block">
              <div className="price-lowest"><h1>{auction.starting_price.toLocaleString("fa-IR")} <span>تومان</span></h1></div>
              <p className="price-lowest-note">{status === "SOLD" ? "این کالا به فروش رفته است" : status === "UPCOMING" ? "قیمت شروع" : "این حراج بدون خریدار پایان یافت"}</p>
            </div>
          )}

          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

          {isActive && (
            <button onClick={handleBuy} disabled={buying} className="product-buy-btn" style={{ justifyContent: "center", width: "100%" }}>
              <ShoppingBag size={18} /> {buying ? "در حال ثبت..." : `خرید فوری به قیمت ${currentPrice.toLocaleString("fa-IR")} تومان`}
            </button>
          )}
          {!isLoggedIn && isActive && <p className="min-order-note">برای خرید ابتدا باید وارد حساب کاربری خود شوید.</p>}

          <div className="product-description">
            <h3 className="product-section-title">توضیحات محصول</h3>
            <p className="product-description-text">{auction.description}</p>
          </div>

          {auction.rules_text && (
            <div className="product-description">
              <h3 className="product-section-title">قوانین این حراج</h3>
              <p className="product-description-text">{auction.rules_text}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}