"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Clock, Users, Gavel, Heart, Wallet, Zap, EyeOff } from "lucide-react";
import { getAuctionLiveState, payAuctionEntryFee, placeAuctionBid, toggleAuctionFavorite, setAuctionProxyBid } from "@/app/(shop)/auctions/actions";
import AuctionBidChart from "./AuctionBidChart";
import AuctionShareButtons from "./AuctionShareButtons";
import type { BidHistoryItem } from "@/lib/auction/queries";
import AuctionGroupBiddingBox from "./AuctionGroupBiddingBox";

interface Auction {
  id: string; title: string; description: string; images: string[];
  base_price: number; min_increment: number; entry_fee: number; shipping_cost: number;
  ends_at: string; starts_at: string; status: string; rules_text: string | null; is_sealed: boolean;
}

function useCountdown(endsAt: string) {
  const [remaining, setRemaining] = useState(() => Math.max(0, new Date(endsAt).getTime() - Date.now()));
  useEffect(() => {
    const timer = setInterval(() => setRemaining(Math.max(0, new Date(endsAt).getTime() - Date.now())), 1000);
    return () => clearInterval(timer);
  }, [endsAt]);
  const totalSec = Math.floor(remaining / 1000);
  return {
    days: Math.floor(totalSec / 86400),
    hours: Math.floor((totalSec % 86400) / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60,
    isOver: remaining <= 0,
  };
}

export default function AuctionDetailClient({
  auction, isLoggedIn, entryFeePaid, myWalletBalance, myProxyMax, isBlacklisted,
  initialHighestBid, initialBidCount, initialParticipantCount, initialBidHistory, isFavorited,
}: {
  auction: Auction; isLoggedIn: boolean; entryFeePaid: boolean; myWalletBalance: number; myProxyMax: number | null; isBlacklisted: boolean;
  initialHighestBid: number | null; initialBidCount: number; initialParticipantCount: number;
  initialBidHistory: BidHistoryItem[]; isFavorited: boolean;
}) {
  const [activeImage, setActiveImage] = useState(0);
  const [highestBid, setHighestBid] = useState(initialHighestBid);
  const [bidCount, setBidCount] = useState(initialBidCount);
  const [participantCount, setParticipantCount] = useState(initialParticipantCount);
  const [status, setStatus] = useState(auction.status);
  const [endsAt, setEndsAt] = useState(auction.ends_at);
  const [paid, setPaid] = useState(entryFeePaid);
  const [bidHistory, setBidHistory] = useState(initialBidHistory);
  const [favorited, setFavorited] = useState(isFavorited);
  const [proxyMax, setProxyMax] = useState(myProxyMax);
  const [showProxyBox, setShowProxyBox] = useState(false);
  const [proxyInput, setProxyInput] = useState("");
  const [proxySaving, setProxySaving] = useState(false);

  const sealedHidden = auction.is_sealed && (status === "ACTIVE" || status === "UPCOMING");
  const myOwnBid = bidHistory.find((b) => b.isMine)?.amount ?? null;

  const minNext = sealedHidden
    ? Math.max(auction.base_price, (myOwnBid ?? 0) + 1)
    : (highestBid ?? auction.base_price - auction.min_increment) + auction.min_increment;

  const [bidAmount, setBidAmount] = useState(
    sealedHidden ? minNext.toString() : highestBid ? minNext.toString() : auction.base_price.toString()
  );
  const [paying, setPaying] = useState(false);
  const [bidding, setBidding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const countdown = useCountdown(endsAt);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const poll = useCallback(async () => {
    const state = await getAuctionLiveState(auction.id);
    setHighestBid(state.highestBid);
    setBidCount(state.bidCount);
    setParticipantCount(state.participantCount);
    setStatus(state.status);
    if (state.endsAt) setEndsAt(state.endsAt);
  }, [auction.id]);

  useEffect(() => {
    pollRef.current = setInterval(poll, 8000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [poll]);

  async function handlePayEntryFee() {
    setError(null);
    setPaying(true);
    const result = await payAuctionEntryFee(auction.id);
    setPaying(false);
    if (result?.error === "insufficient_balance") {
      setError(`موجودی حساب شما کافی نیست. لطفاً حداقل ${(result.required ?? 0).toLocaleString("fa-IR")} تومان کیف پول خود را شارژ کنید.`);
      return;
    }
    if (result?.error) { setError(result.error); return; }
    setPaid(true);
    setMessage("هزینه شرکت با موفقیت پرداخت شد. اکنون می‌توانید پیشنهاد خود را ثبت کنید.");
  }

  async function handleBid() {
    setError(null);
    setMessage(null);
    const amount = Number(bidAmount);
    if (!amount || amount < minNext) { setError(`مبلغ پیشنهادی باید حداقل ${minNext.toLocaleString("fa-IR")} تومان باشد.`); return; }
    const confirmMsg = sealedHidden
      ? `آیا از ثبت پیشنهاد مخفی ${amount.toLocaleString("fa-IR")} تومانی مطمئن هستید؟ این مبلغ تا پایان مزایده برای دیگران نمایش داده نمی‌شود.`
      : `آیا از ثبت پیشنهاد ${amount.toLocaleString("fa-IR")} تومانی مطمئن هستید؟ امکان لغو یا کاهش آن وجود ندارد.`;
    if (!confirm(confirmMsg)) return;
    setBidding(true);
    const result = await placeAuctionBid(auction.id, amount);
    setBidding(false);
    if (result?.error) { setError(result.error); return; }
    setMessage(sealedHidden ? "پیشنهاد مخفی شما با موفقیت ثبت شد." : "پیشنهاد شما با موفقیت ثبت شد.");
    poll();
    setBidHistory((prev) => [{ id: `local-${Date.now()}`, amount, createdAt: new Date().toISOString(), displayName: sealedHidden ? "پیشنهاد شما" : "شما", isMine: true }, ...prev]);
  }

  async function handleProxySave() {
    setError(null);
    const amount = Number(proxyInput);
    if (!amount || amount < minNext) { setError(`سقف پیشنهاد خودکار باید حداقل ${minNext.toLocaleString("fa-IR")} تومان باشد.`); return; }
    setProxySaving(true);
    const result = await setAuctionProxyBid(auction.id, amount);
    setProxySaving(false);
    if (result?.error) { setError(result.error); return; }
    setProxyMax(amount);
    setShowProxyBox(false);
    setMessage("پیشنهاد خودکار شما فعال شد. سیستم تا این سقف به‌صورت خودکار برای شما رقابت می‌کند.");
    poll();
  }

  async function handleFavorite() {
    const result = await toggleAuctionFavorite(auction.id);
    if (result?.needsLogin) { window.location.href = "/login"; return; }
    setFavorited(!!result?.added);
  }

  const isActive = status === "ACTIVE" && !countdown.isOver;
  const chartPoints = bidHistory.filter((b) => !sealedHidden || b.isMine).map((b) => ({ amount: b.amount, createdAt: b.createdAt }));

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
            <button className="product-share-btn" onClick={handleFavorite}>
              <Heart size={16} fill={favorited ? "#ef4444" : "none"} color={favorited ? "#ef4444" : undefined} />
            </button>
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
            <span className="product-badge-new" style={{ background: isActive ? "#16a34a" : "#9ca3af" }}>
              {isActive ? "در حال برگزاری" : status === "UPCOMING" ? "به‌زودی شروع می‌شود" : "پایان یافته"}
            </span>
          </div>

          <div className="flex items-center justify-between mb-3">
            <AuctionShareButtons title={auction.title} path={`/auctions/${auction.id}`} />
            {auction.is_sealed && (
              <span className="badge badge-warning flex items-center gap-1"><EyeOff size={12} /> پیشنهاد مخفی</span>
            )}
          </div>

          {isActive && (
            <div className="qty-total-preview" style={{ background: "#fffbeb", borderColor: "#fde68a" }}>
              <div className="flex items-center gap-2 mb-1"><Clock size={16} className="text-amber-600" /><b>زمان باقی‌مانده:</b></div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#b45309" }}>
                {countdown.days > 0 && `${countdown.days.toLocaleString("fa-IR")} روز `}
                {String(countdown.hours).padStart(2, "0")}:{String(countdown.minutes).padStart(2, "0")}:{String(countdown.seconds).padStart(2, "0")}
              </div>
            </div>
          )}

          {sealedHidden ? (
            <div className="sealed-bid-note">
              🔒 این مزایده از نوع پیشنهاد مخفی است — پیشنهادها تا پایان مزایده از دید همه (از جمله شما نسبت به دیگران) پنهان است.
              {myOwnBid && <><br />پیشنهاد فعلی شما: <b>{myOwnBid.toLocaleString("fa-IR")} تومان</b></>}
            </div>
          ) : (
            <div className="product-price-block">
              <div className="price-lowest">
                <h1>{(highestBid ?? auction.base_price).toLocaleString("fa-IR")} <span>تومان</span></h1>
              </div>
              <p className="price-lowest-note">{highestBid ? "بالاترین پیشنهاد فعلی" : "قیمت پایه"}</p>
            </div>
          )}

          <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
            <span className="flex items-center gap-1"><Gavel size={14} /> {bidCount.toLocaleString("fa-IR")} پیشنهاد</span>
            <span className="flex items-center gap-1"><Users size={14} /> {participantCount.toLocaleString("fa-IR")} شرکت‌کننده</span>
          </div>

          {auction.entry_fee > 0 && (
            <div className="points-earn-badge">
              💰 هزینه شرکت در این مزایده: <b>{auction.entry_fee.toLocaleString("fa-IR")} تومان</b>
              {isLoggedIn && <span>موجودی کیف پول شما: {myWalletBalance.toLocaleString("fa-IR")} تومان</span>}
            </div>
          )}

          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          {message && <p className="text-green-600 text-sm mb-3">{message}</p>}

          {!isLoggedIn ? (
            <a href="/login" className="product-buy-btn" style={{ justifyContent: "center" }}>ورود برای شرکت در مزایده</a>
          ) : isBlacklisted ? (
            <p className="product-stock-note" style={{ color: "#dc2626" }}>
              به دلیل عدم پرداخت به‌موقع در مزایده‌های قبلی، امکان شرکت در مزایده‌های جدید برای شما موقتاً غیرفعال شده است. لطفاً با پشتیبانی تماس بگیرید.
            </p>
          ) : !isActive ? (
            <p className="product-stock-note">{status === "UPCOMING" ? "مزایده هنوز شروع نشده است." : "این مزایده به پایان رسیده است."}</p>
          ) : !paid ? (
            <button onClick={handlePayEntryFee} disabled={paying} className="product-buy-btn" style={{ justifyContent: "center" }}>
              <Wallet size={18} /> {paying ? "در حال پرداخت..." : `پرداخت هزینه شرکت (${auction.entry_fee.toLocaleString("fa-IR")} تومان)`}
            </button>
          ) : (
            <>
              <div className="product-qty-row">
                <div className="product-qty-control" style={{ flex: 1 }}>
                  <input type="number" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} className="qty-input" style={{ width: "100%" }} min={minNext} />
                </div>
                <button onClick={handleBid} disabled={bidding} className="product-buy-btn">
                  {bidding ? "در حال ثبت..." : sealedHidden ? "ثبت پیشنهاد مخفی" : "ثبت پیشنهاد"}
                </button>
              </div>
              <p className="min-order-note">
                {sealedHidden ? `حداقل پیشنهاد شما: ${minNext.toLocaleString("fa-IR")} تومان` : `حداقل پیشنهاد بعدی: ${minNext.toLocaleString("fa-IR")} تومان`}
              </p>

              {!auction.is_sealed && (
                <div className="proxy-bid-box">
                  {proxyMax ? (
                    <p className="text-xs text-gray-600 flex items-center gap-1">
                      <Zap size={13} className="text-amber-500" /> پیشنهاد خودکار شما فعال است — تا سقف <b>{proxyMax.toLocaleString("fa-IR")} تومان</b>
                      <button onClick={() => setShowProxyBox(true)} className="text-green-600 underline mr-1">ویرایش</button>
                    </p>
                  ) : !showProxyBox ? (
                    <button onClick={() => setShowProxyBox(true)} className="text-xs text-gray-600 flex items-center gap-1">
                      <Zap size={13} className="text-amber-500" /> فعال‌سازی پیشنهاد خودکار (Proxy Bidding)
                    </button>
                  ) : null}

                  {showProxyBox && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-2">حداکثر مبلغی که مایلید برای این کالا بپردازید را وارد کنید؛ سیستم تا این سقف به‌صورت خودکار برای شما رقابت می‌کند.</p>
                      <div className="flex gap-2">
                        <input type="number" value={proxyInput} onChange={(e) => setProxyInput(e.target.value)} placeholder="مثلاً 5000000" className="admin-input" style={{ flex: 1 }} />
                        <button onClick={handleProxySave} disabled={proxySaving} className="admin-btn admin-btn-primary">{proxySaving ? "..." : "فعال‌سازی"}</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <AuctionGroupBiddingBox auctionId={auction.id} entryFeePaid={paid} minNextBid={minNext} />
            </>
          )}

          <div className="product-description">
            <h3 className="product-section-title">توضیحات محصول</h3>
            <p className="product-description-text">{auction.description}</p>
          </div>

          {auction.rules_text && (
            <div className="product-description">
              <h3 className="product-section-title">قوانین این مزایده</h3>
              <p className="product-description-text">{auction.rules_text}</p>
            </div>
          )}

          {!sealedHidden && chartPoints.length >= 2 && (
            <div className="product-description">
              <h3 className="product-section-title">نمودار زنده پیشنهادها</h3>
              <AuctionBidChart points={chartPoints} basePrice={auction.base_price} />
            </div>
          )}

          <div className="product-description">
            <h3 className="product-section-title">تاریخچه پیشنهادها</h3>
            {bidHistory.length > 0 ? (
              <table className="qty-tiers-table">
                <thead><tr><th>کاربر</th><th>مبلغ</th><th>زمان</th></tr></thead>
                <tbody>
                  {bidHistory.map((b) => (
                    <tr key={b.id} style={b.isMine ? { background: "#f0fdf4" } : undefined}>
                      <td>{b.displayName}</td>
                      <td>{b.amount.toLocaleString("fa-IR")} تومان</td>
                      <td className="text-xs text-gray-500">{new Date(b.createdAt).toLocaleTimeString("fa-IR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="product-description-text">{sealedHidden ? "شما هنوز پیشنهادی ثبت نکرده‌اید." : "هنوز پیشنهادی ثبت نشده — اولین نفر باشید!"}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}