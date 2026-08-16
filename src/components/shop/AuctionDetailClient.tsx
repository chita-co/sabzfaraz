"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Clock, Users, Gavel, Heart, Wallet, Zap, EyeOff } from "lucide-react";
import { getAuctionLiveState, payAuctionEntryFee, placeAuctionBid, toggleAuctionFavorite, setAuctionProxyBid } from "@/app/(shop)/auctions/actions";
import AuctionBidChart from "./AuctionBidChart";
import AuctionShareButtons from "./AuctionShareButtons";
import AuctionGroupBiddingBox from "./AuctionGroupBiddingBox";
import type { BidHistoryItem } from "@/lib/auction/queries";
import "./auction-detail.css";

interface Auction {
  id: string; title: string; description: string; images: string[];
  base_price: number; min_increment: number; entry_fee: number; shipping_cost: number;
  ends_at: string; starts_at: string; status: string; rules_text: string | null; is_sealed: boolean;
}

const statusColor: Record<string, string> = {
  ACTIVE: "#16a34a", UPCOMING: "#3b82f6", ENDED: "#6b7280",
  WINNER_DETERMINED: "#16a34a", CANCELLED: "#dc2626", FAILED_NO_WINNER: "#6b7280",
};
const statusLabel: Record<string, string> = {
  ACTIVE: "در حال برگزاری", UPCOMING: "به‌زودی شروع می‌شود", ENDED: "پایان یافته",
  WINNER_DETERMINED: "برنده مشخص شد", CANCELLED: "لغو شده", FAILED_NO_WINNER: "بدون برنده",
};

function useCountdown(endsAt: string) {
  const [remaining, setRemaining] = useState<number | null>(null); // null یعنی «هنوز mount نشده»

  useEffect(() => {
    function tick() {
      setRemaining(Math.max(0, new Date(endsAt).getTime() - Date.now()));
    }
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [endsAt]);

  if (remaining === null) {
    // دقیقاً همین مقدار روی سرور و در اولین رندر کلاینت (پیش از mount) استفاده می‌شود — بدون تفاوت
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isOver: false, ready: false };
  }

  const totalSec = Math.floor(remaining / 1000);
  return {
    days: Math.floor(totalSec / 86400),
    hours: Math.floor((totalSec % 86400) / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60,
    isOver: remaining <= 0,
    ready: true,
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

  const [bidAmount, setBidAmount] = useState(String(sealedHidden ? minNext : (highestBid ? minNext : auction.base_price)));
  const [paying, setPaying] = useState(false);
  const [bidding, setBidding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
useEffect(() => {
  const timer = setTimeout(() => setMounted(true), 0);
  return () => clearTimeout(timer);
}, []);

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
      ? `آیا از ثبت پیشنهاد مخفی ${amount.toLocaleString("fa-IR")} تومانی مطمئن هستید؟`
      : `آیا از ثبت پیشنهاد ${amount.toLocaleString("fa-IR")} تومانی مطمئن هستید؟ امکان لغو یا کاهش آن وجود ندارد.`;
    if (!confirm(confirmMsg)) return;
    setBidding(true);
    const result = await placeAuctionBid(auction.id, amount);
    setBidding(false);
    if (result?.error) { setError(result.error); return; }
    setMessage(sealedHidden ? "پیشنهاد مخفی شما با موفقیت ثبت شد." : "پیشنهاد شما با موفقیت ثبت شد.");
    poll();
    setBidHistory((prev) => [{ id: `local-${Date.now()}`, amount, createdAt: new Date().toISOString(), displayName: sealedHidden ? "پیشنهاد شما" : "شما", isMine: true }, ...prev]);
    setBidAmount(String(amount + auction.min_increment));
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
    setMessage("پیشنهاد خودکار شما فعال شد.");
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
    <div className="ad-wrap">
      <div className="ad-grid">
        {/* گالری */}
        <div className="ad-gallery">
          <div className="ad-gallery-main">
            {auction.images?.[activeImage] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={auction.images[activeImage]} alt={auction.title} />
            ) : (
              <div className="ad-gallery-no-image">بدون تصویر</div>
            )}
            <button className="ad-fav-btn" onClick={handleFavorite} aria-label="علاقه‌مندی">
              <Heart size={17} fill={favorited ? "#ef4444" : "none"} color={favorited ? "#ef4444" : "#fff"} />
            </button>
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

        {/* اطلاعات و ثبت پیشنهاد */}
        <div className="ad-info">
          <div className="ad-title-row">
            <h1 className="ad-title">{auction.title}</h1>
            <span className="ad-status-badge" style={{ background: statusColor[status] }}>{statusLabel[status]}</span>
          </div>

          <div className="ad-share-row">
            <AuctionShareButtons title={auction.title} path={`/auctions/${auction.id}`} />
            {auction.is_sealed && (
              <span className="ad-status-badge" style={{ background: "#b45309", display: "inline-flex", alignItems: "center", gap: 5 }}>
                <EyeOff size={12} /> پیشنهاد مخفی
              </span>
            )}
          </div>

          {isActive && (
  <div className="ad-countdown-card">
    <div className="ad-countdown-label"><Clock size={15} /> زمان باقی‌مانده تا پایان مزایده</div>
    <div className="ad-countdown-value">
      {countdown.ready ? (
        <>
          <span className="ad-countdown-time" dir="ltr">
            {String(countdown.hours).padStart(2, "0")}:{String(countdown.minutes).padStart(2, "0")}:{String(countdown.seconds).padStart(2, "0")}
          </span>
          {countdown.days > 0 && (
            <span className="ad-countdown-days">و {countdown.days} روز</span>
          )}
        </>
      ) : (
        <span className="ad-countdown-time" dir="ltr">--:--:--</span>
      )}
    </div>
  </div>
)}

          {sealedHidden ? (
            <div className="ad-sealed-note">
              🔒 این مزایده از نوع پیشنهاد مخفی است — پیشنهادها تا پایان مزایده از دید همه (از جمله شما نسبت به دیگران) پنهان می‌ماند.
              {myOwnBid && <><br />پیشنهاد فعلی شما: <b>{myOwnBid.toLocaleString("fa-IR")} تومان</b></>}
            </div>
          ) : (
            <div className="ad-price-card">
              <div className="ad-price-label">{highestBid ? "بالاترین پیشنهاد فعلی" : "قیمت پایه (شروع مزایده)"}</div>
              <div className="ad-price-value">{(highestBid ?? auction.base_price).toLocaleString("fa-IR")}<small>تومان</small></div>
            </div>
          )}

          <div className="ad-stats-row">
            <span className="ad-stat"><Gavel size={14} /> <b>{bidCount.toLocaleString("fa-IR")}</b> پیشنهاد ثبت‌شده</span>
            <span className="ad-stat"><Users size={14} /> <b>{participantCount.toLocaleString("fa-IR")}</b> شرکت‌کننده</span>
          </div>

          {auction.entry_fee > 0 && (
            <div className="ad-entry-fee-box">
              💰 هزینه شرکت در این مزایده: <b>{auction.entry_fee.toLocaleString("fa-IR")} تومان</b>
              {isLoggedIn && <span className="ad-wallet-line">موجودی کیف پول شما: {myWalletBalance.toLocaleString("fa-IR")} تومان</span>}
            </div>
          )}

          {error && <p className="ad-error">{error}</p>}
          {message && <p className="ad-success">{message}</p>}

          {!isLoggedIn ? (
            <a href="/login" className="ad-cta-btn">ورود برای شرکت در مزایده</a>
          ) : isBlacklisted ? (
            <div className="ad-disabled-note" style={{ color: "#fca5a5" }}>
              به دلیل عدم پرداخت به‌موقع در مزایده‌های قبلی، امکان شرکت در مزایده‌های جدید برای شما موقتاً غیرفعال شده است. با پشتیبانی تماس بگیرید.
            </div>
          ) : !isActive ? (
            <div className="ad-disabled-note">
              {status === "UPCOMING" ? "این مزایده هنوز شروع نشده است." : "این مزایده به پایان رسیده است."}
            </div>
          ) : !paid ? (
            <button onClick={handlePayEntryFee} disabled={paying} className="ad-cta-btn">
              <Wallet size={18} /> {paying ? "در حال پرداخت..." : `پرداخت هزینه شرکت (${auction.entry_fee.toLocaleString("fa-IR")} تومان)`}
            </button>
          ) : (
            <>
              <div className="ad-bid-row">
                <input type="number" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} className="ad-bid-input" min={minNext} />
                <button onClick={handleBid} disabled={bidding} className="ad-cta-btn" style={{ width: "auto", flexShrink: 0, padding: "0 22px" }}>
                  {bidding ? "..." : sealedHidden ? "ثبت پیشنهاد مخفی" : "ثبت پیشنهاد"}
                </button>
              </div>
              <p className="ad-bid-note">
                {sealedHidden ? `حداقل پیشنهاد شما: ${minNext.toLocaleString("fa-IR")} تومان` : `حداقل پیشنهاد بعدی: ${minNext.toLocaleString("fa-IR")} تومان`}
              </p>

              {!auction.is_sealed && (
                <div className="ad-proxy-box">
                  {proxyMax ? (
                    <p className="ad-bid-note" style={{ marginBottom: 0 }}>
                      <Zap size={12} style={{ display: "inline", color: "#fbbf24" }} /> پیشنهاد خودکار فعال — تا سقف <b style={{ color: "#fff" }}>{proxyMax.toLocaleString("fa-IR")} تومان</b>{" "}
                      <button onClick={() => setShowProxyBox(true)} className="ad-proxy-trigger" style={{ display: "inline", color: "#4ade80" }}>ویرایش</button>
                    </p>
                  ) : !showProxyBox ? (
                    <button onClick={() => setShowProxyBox(true)} className="ad-proxy-trigger">
                      <Zap size={13} style={{ color: "#fbbf24" }} /> فعال‌سازی پیشنهاد خودکار (Proxy Bidding)
                    </button>
                  ) : null}

                  {showProxyBox && (
                    <div className="ad-proxy-input-row">
                      <input type="number" value={proxyInput} onChange={(e) => setProxyInput(e.target.value)} placeholder="حداکثر مبلغ پیشنهادی شما" className="ad-proxy-input" />
                      <button onClick={handleProxySave} disabled={proxySaving} className="ad-cta-btn" style={{ width: "auto", padding: "0 18px" }}>{proxySaving ? "..." : "فعال"}</button>
                    </div>
                  )}
                </div>
              )}

              <AuctionGroupBiddingBox auctionId={auction.id} entryFeePaid={paid} minNextBid={minNext} />
            </>
          )}

          <div className="ad-section">
            <h3 className="ad-section-title">توضیحات محصول</h3>
            <p className="ad-section-text">{auction.description}</p>
          </div>

          {auction.rules_text && (
            <div className="ad-section">
              <h3 className="ad-section-title">قوانین این مزایده</h3>
              <p className="ad-section-text">{auction.rules_text}</p>
            </div>
          )}

          {!sealedHidden && chartPoints.length >= 2 && (
            <div className="ad-section">
              <h3 className="ad-section-title">نمودار زنده پیشنهادها</h3>
              <AuctionBidChart points={chartPoints} basePrice={auction.base_price} />
            </div>
          )}

          <div className="ad-section">
            <h3 className="ad-section-title">تاریخچه پیشنهادها</h3>
            {bidHistory.length > 0 ? (
              <table className="ad-history-table">
                <thead><tr><th>کاربر</th><th>مبلغ</th><th>زمان</th></tr></thead>
                <tbody>
                  {bidHistory.map((b) => (
                    <tr key={b.id} className={b.isMine ? "ad-mine" : ""}>
                      <td>{b.displayName}</td>
                      <td>{b.amount.toLocaleString("fa-IR")} تومان</td>
                      <td className="text-xs text-gray-500">{mounted ? new Date(b.createdAt).toLocaleTimeString("fa-IR") : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="ad-history-empty">{sealedHidden ? "شما هنوز پیشنهادی ثبت نکرده‌اید." : "هنوز پیشنهادی ثبت نشده — اولین نفر باشید!"}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}