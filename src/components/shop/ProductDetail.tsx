"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Share2, ShoppingCart, Check, ChevronDown, ChevronLeft, ChevronRight, Ship, Clock, AlertTriangle, Store } from "lucide-react";
import { Product, ProductQuantityTier, ProductAttribute } from "@/types";
import { useCartStore } from "@/store/cart-store";
import WishlistButton from "./WishlistButton";
import { StarRatingDisplay } from "./StarRating";
import { calculatePointsToEarn } from "@/lib/loyalty/points-utils";
import RelatedArticlesForProduct from "@/components/blog/RelatedArticlesForProduct";
import type { BlogPost } from "@/types/blog";

const unitLabelFa: Record<string, string> = { day: "روز", week: "هفته", month: "ماه" };

export default function ProductDetail({
  product, isWishlisted, avgRating = 0, reviewCount = 0, quantityTiers = [], attributes = [], relatedArticles = [],
  tomanPerPoint = 1000, pointsMultiplier = 1, pointValueToman = 100,
}: {
  product: Product; isWishlisted: boolean; avgRating?: number; reviewCount?: number; quantityTiers?: ProductQuantityTier[]; attributes?: ProductAttribute[]; relatedArticles?: BlogPost[];
  tomanPerPoint?: number; pointsMultiplier?: number; pointValueToman?: number;
}) {
  const [activeImage, setActiveImage] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
const [zoomScale, setZoomScale] = useState(1);
const [zoomOffset, setZoomOffset] = useState({ x: 0, y: 0 });
const lastTouchDistanceRef = useRef<number | null>(null);
const lastPanRef = useRef<{ x: number; y: number } | null>(null);
const isDraggingRef = useRef(false);
const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(product.colors?.[0]?.name ?? null);
  const [selectedSize, setSelectedSize] = useState<string | null>(product.sizes?.[0] ?? null);
  const minQuantity = product.has_min_order_quantity && product.min_order_quantity
    ? product.min_order_quantity
    : (product.is_sold_by_unit ? 0.1 : 1);
  const [quantity, setQuantity] = useState(minQuantity);
  const [quantityInput, setQuantityInput] = useState(String(minQuantity));
  const [added, setAdded] = useState(false);
  const [showTiersTable, setShowTiersTable] = useState(false);

  // ===== سفارش از چین =====
  const [chinaTermsAccepted, setChinaTermsAccepted] = useState(false);
  const [showChinaTerms, setShowChinaTerms] = useState(false);
  const [chinaAdded, setChinaAdded] = useState(false);
  const showInstant = product.fulfillment_type === "INSTANT" || product.fulfillment_type === "BOTH";
  const showChina = product.fulfillment_type === "CHINA_ORDER" || product.fulfillment_type === "BOTH";
  const isBothModes = product.fulfillment_type === "BOTH";

  const addItem = useCartStore((s) => s.addItem);

  const matchedTier = quantityTiers.find((t) => quantity >= t.min_qty && quantity <= t.max_qty);
  const finalPrice = matchedTier ? matchedTier.unit_price : (product.discount_price ?? product.price);
  const hasDiscount = !!product.discount_price && product.discount_price < product.price && !matchedTier;
  const discountPercent = hasDiscount
    ? Math.round(100 - (product.discount_price! / product.price) * 100)
    : 0;

  const basePrice = product.discount_price ?? product.price;
  const lowestTier = quantityTiers.length > 0
    ? [...quantityTiers].sort((a, b) => a.unit_price - b.unit_price)[0]
    : null;
  const pointsToEarn = calculatePointsToEarn(finalPrice * quantity, tomanPerPoint, pointsMultiplier);
  const unitLabel = product.is_sold_by_unit && product.unit_label ? product.unit_label : "عدد";
  const activeColor = product.colors?.find((c) => c.name === selectedColor);
  const accentColor = activeColor?.hex ?? "#2175f5";
  const outOfStock = product.stock !== null && product.stock <= 0;

  const chinaDeliveryText = product.china_delivery_text ||
    (product.china_delivery_min && product.china_delivery_max
      ? `بین ${product.china_delivery_min.toLocaleString("fa-IR")} تا ${product.china_delivery_max.toLocaleString("fa-IR")} ${unitLabelFa[product.china_delivery_unit] ?? "روز"}`
      : null);
  const chinaTermsMessage = product.china_terms_text ||
    (chinaDeliveryText
      ? `مشتری عزیز، شما با آگاهی از این‌که زمان تحویل این محصول فوری نیست و ${chinaDeliveryText} به دست شما خواهد رسید، اقدام به ثبت سفارش می‌نمایید.`
      : "مشتری عزیز، شما با آگاهی از این‌که این محصول به‌صورت سفارشی و با تأخیر تحویل داده می‌شود، اقدام به ثبت سفارش می‌نمایید.");
      const chinaOrderNote = product.china_order_note || null;

  function handleAddToCart() {
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      image: product.images?.[0] ?? "",
      price: product.price,
      discountPrice: matchedTier ? matchedTier.unit_price : product.discount_price,
      quantityTiers: quantityTiers.map((t) => ({ min_qty: t.min_qty, max_qty: t.max_qty, unit_price: t.unit_price })),
      baseDiscountPrice: product.discount_price,
      selectedColor,
      selectedSize,
      quantity,
      stock: product.stock,
      weightGrams: product.weight_grams,
      unitLabel: product.is_sold_by_unit ? unitLabel : null,
      minQuantity: product.has_min_order_quantity && product.min_order_quantity
        ? product.min_order_quantity
        : (product.is_sold_by_unit ? 0.1 : 1),
      isChinaOrder: false,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function handleAddChinaOrderToCart() {
    if (!chinaTermsAccepted || !product.china_price) return;
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      image: product.images?.[0] ?? "",
      price: product.china_price,
      discountPrice: null,
      selectedColor,
      selectedSize,
      quantity: 1,
      stock: null,
      weightGrams: product.weight_grams,
      unitLabel: null,
      minQuantity: 1,
      isChinaOrder: true,
      chinaDeliveryText,
      chinaTermsText: chinaTermsMessage,
      chinaOrderNote,
    });
    setChinaAdded(true);
    setTimeout(() => setChinaAdded(false), 2000);
  }

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      alert("لینک محصول کپی شد.");
    }
  }

   const resetZoom = useCallback(() => {
    setZoomScale(1);
    setZoomOffset({ x: 0, y: 0 });
  }, []);

  const openZoom = useCallback(() => {
    resetZoom();
    setZoomOpen(true);
  }, [resetZoom]);

  const closeZoom = useCallback(() => {
    setZoomOpen(false);
    resetZoom();
  }, [resetZoom]);

  function handleZoomWheel(e: React.WheelEvent) {
    e.preventDefault();
    setZoomScale((s) => Math.min(4, Math.max(1, s - e.deltaY * 0.0015)));
  }

  function handleZoomDoubleClick() {
    setZoomScale((s) => (s > 1 ? 1 : 2.5));
    setZoomOffset({ x: 0, y: 0 });
  }

  const goPrevImage = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!product.images || product.images.length < 2) return;
    setActiveImage((i) => (i - 1 + product.images!.length) % product.images!.length);
    resetZoom();
  }, [product.images, resetZoom]);

  const goNextImage = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!product.images || product.images.length < 2) return;
    setActiveImage((i) => (i + 1) % product.images!.length);
    resetZoom();
  }, [product.images, resetZoom]);

  function getTouchDistance(touches: React.TouchList) {
    const t1 = touches[0], t2 = touches[1];
    return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
  }

  function handleZoomTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      lastTouchDistanceRef.current = getTouchDistance(e.touches);
    } else if (e.touches.length === 1 && zoomScale > 1) {
      isDraggingRef.current = true;
      lastPanRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 1) {
      swipeStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }

  function handleZoomTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 2 && lastTouchDistanceRef.current) {
      e.preventDefault();
      const newDistance = getTouchDistance(e.touches);
      const delta = newDistance / lastTouchDistanceRef.current;
      setZoomScale((s) => Math.min(4, Math.max(1, s * delta)));
      lastTouchDistanceRef.current = newDistance;
    } else if (e.touches.length === 1 && isDraggingRef.current && lastPanRef.current) {
      e.preventDefault();
      const dx = e.touches[0].clientX - lastPanRef.current.x;
      const dy = e.touches[0].clientY - lastPanRef.current.y;
      setZoomOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
      lastPanRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }

  function handleZoomTouchEnd(e: React.TouchEvent) {
    if (e.touches.length < 2) lastTouchDistanceRef.current = null;
    if (e.touches.length === 0) {
      isDraggingRef.current = false;
      lastPanRef.current = null;
      if (zoomScale <= 1) setZoomOffset({ x: 0, y: 0 });

      if (swipeStartRef.current && e.changedTouches.length > 0 && zoomScale <= 1) {
        const dx = e.changedTouches[0].clientX - swipeStartRef.current.x;
        const dy = e.changedTouches[0].clientY - swipeStartRef.current.y;
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          if (dx < 0) goNextImage();
          else goPrevImage();
        }
      }
      swipeStartRef.current = null;
    }
  }

  useEffect(() => {
    if (!zoomOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeZoom();
      else if (e.key === "ArrowRight") goNextImage();
      else if (e.key === "ArrowLeft") goPrevImage();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [zoomOpen, closeZoom, goNextImage, goPrevImage]);

  return (
    <div className="product-page" style={{ "--primary": accentColor } as React.CSSProperties}>
      <div className="product-card">
        <div className="product-gallery">
          <div className="product-gallery-main">
  {product.images?.[activeImage] ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={product.images[activeImage]}
      alt={product.name}
      className="product-image-zoomable"
      onClick={openZoom}
    />
  ) : (
    <div className="product-no-image">بدون تصویر</div>
  )}
            {product.stock !== null && product.stock <= 0 && showInstant ? (
              <div className="out-of-stock-stamp">
                <div className="out-of-stock-stamp-inner">
                  <span className="out-of-stock-stamp-text">متاسفانه <br />این محصول تمام شد</span>
                </div>
              </div>
            ) : product.is_stock ? (
              <div className="stock-ribbon-wrap">
                <span className="stock-ribbon">استوک</span>
              </div>
            ) : null}
            <button className="product-share-btn" onClick={handleShare}>
              <Share2 size={16} />
            </button>
            <div className="product-wishlist-overlay">
              <WishlistButton productId={product.id} initialWishlisted={isWishlisted} size={20} />
            </div>
            {hasDiscount && showInstant && <span className="product-discount-badge">{discountPercent}%-</span>}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="product-thumbs">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  className={`product-thumb${i === activeImage ? " active" : ""}`}
                  onClick={() => setActiveImage(i)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        {zoomOpen && product.images?.[activeImage] && typeof document !== "undefined" &&
  createPortal(
    <div
      className="product-image-lightbox"
      onClick={closeZoom}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483647,
        isolation: "isolate",
      }}
    >
      <button className="product-image-lightbox-close" onClick={closeZoom}>✕</button>
      {product.images.length > 1 && (
        <>
          <button className="product-image-lightbox-nav product-image-lightbox-prev" onClick={goPrevImage}>
            <ChevronLeft size={22} />
          </button>
          <button className="product-image-lightbox-nav product-image-lightbox-next" onClick={goNextImage}>
            <ChevronRight size={22} />
          </button>
        </>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={product.images[activeImage]}
        alt={product.name}
        className="product-image-lightbox-img"
        style={{
          transform: `scale(${zoomScale}) translate(${zoomOffset.x / zoomScale}px, ${zoomOffset.y / zoomScale}px)`,
        }}
        onClick={(e) => e.stopPropagation()}
        onWheel={handleZoomWheel}
        onDoubleClick={handleZoomDoubleClick}
        onTouchStart={handleZoomTouchStart}
        onTouchMove={handleZoomTouchMove}
        onTouchEnd={handleZoomTouchEnd}
        draggable={false}
      />
    </div>,
    document.body
  )
}

        <div className="product-info">
          <div className="product-name-row">
            <div>
              <h1 className="product-title">{product.name}</h1>
              {product.name_en && (
                <p className="product-title-en" dir="ltr">
                  {product.name_en}
                </p>
              )}
              <span className="product-badge-new">جدید</span>
            </div>
            <p className="product-sku">کد محصول: <span dir="ltr">{product.sku}</span></p>
            {reviewCount > 0 && (
              <div className="product-rating-line">
                <StarRatingDisplay value={avgRating} size={14} />
                <span>{avgRating.toFixed(1)} ({reviewCount.toLocaleString("fa-IR")} نظر)</span>
              </div>
            )}
            {product.brand && <h3 className="product-brand">{product.brand}</h3>}
          </div>

          {product.partner_id && product.partner && (
            <div className="partner-supplied-badge">
              <Store size={15} />
              <div>
                <span>تأمین‌شده توسط <a href={`/partner-store/${product.partner_id}`} style={{ fontWeight: 700, textDecoration: "underline" }}>{product.partner.business_name}</a> {product.partner.rating_avg > 0 && `⭐ ${product.partner.rating_avg.toFixed(1)}`}</span>
                <p>این محصول توسط یکی از همکاران سبزفراز تأمین می‌شود و ممکن است ارسال آن ۱ تا ۲ روز کاری تأخیر داشته باشد.</p>
              </div>
            </div>
          )}

          {isBothModes && (
            <div className="china-mixed-warning">
              <AlertTriangle size={15} />
              این محصول هم به‌صورت موجود و فوری و هم از طریق سفارش از چین قابل خرید است. توجه: امکان خرید ترکیبی این دو نوع در یک سبد خرید و یک فاکتور وجود ندارد؛ هرکدام باید جداگانه سفارش داده شوند.
            </div>
          )}

          {product.colors && product.colors.length > 0 && (
            <div className="product-colors">
              <h3 className="product-section-title">رنگ</h3>
              <div className="product-colors-list">
                {product.colors.map((c) => (
                  <span
                    key={c.name}
                    className={`product-color-dot${c.name === selectedColor ? " active" : ""}`}
                    style={{ background: c.hex, borderColor: c.hex }}
                    title={c.name}
                    onClick={() => setSelectedColor(c.name)}
                  />
                ))}
              </div>
              {selectedColor && <span className="product-color-label">{selectedColor}</span>}
            </div>
          )}

          {product.sizes && product.sizes.length > 0 && (
            <div className="product-sizes">
              <h3 className="product-section-title">سایز</h3>
              <div className="product-sizes-list">
                {product.sizes.map((s) => (
                  <span
                    key={s}
                    className={`product-size-item${s === selectedSize ? " active" : ""}`}
                    onClick={() => setSelectedSize(s)}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {showInstant && (
            <>
              <div className="product-price-block">
                {lowestTier ? (
                  <>
                    <div className="price-lowest">
                      <div className="price-lowest-value">{lowestTier.unit_price.toLocaleString("fa-IR")} <span>تومان</span></div>
                    </div>
                    <p className="price-lowest-note">برای سفارش بالای {lowestTier.min_qty.toLocaleString("fa-IR")} عدد</p>
                    <p className="price-reference">{basePrice.toLocaleString("fa-IR")} تومان — برای تعداد ۱ عدد</p>
                    <button type="button" className="qty-tiers-toggle" onClick={() => setShowTiersTable((v) => !v)}>
                      مشاهده قیمت عمده (تخفیف در تعداد)
                      <ChevronDown size={14} style={{ transform: showTiersTable ? "rotate(180deg)" : "none", transition: "0.2s" }} />
                    </button>
                    {showTiersTable && (
                      <table className="qty-tiers-table">
                        <thead><tr><th>تعداد</th><th>قیمت واحد</th></tr></thead>
                        <tbody>
                          {[...quantityTiers].sort((a, b) => a.min_qty - b.min_qty).map((t) => (
                            <tr key={t.id} className={matchedTier?.id === t.id ? "active" : ""}>
                              <td>{t.min_qty.toLocaleString("fa-IR")} تا {t.max_qty.toLocaleString("fa-IR")}</td>
                              <td>{t.unit_price.toLocaleString("fa-IR")} تومان</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </>
                ) : (
                  <div className="price-lowest">
                    {hasDiscount && <span className="price-reference" style={{ marginLeft: 8 }}>{product.price.toLocaleString("fa-IR")}</span>}
                    <div className="price-lowest-value">{finalPrice.toLocaleString("fa-IR")} <span>تومان</span></div>
                  </div>
                )}
              </div>

              <div className="product-qty-row">
                <h3 className="product-section-title">تعداد</h3>
                <div className="product-qty-control">
                  <button
                    onClick={() => {
                      const next = Math.max(minQuantity, quantity - 1);
                      setQuantity(next);
                      setQuantityInput(next.toString());
                    }}
                    disabled={quantity <= minQuantity}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    step={product.is_sold_by_unit ? "0.1" : "1"}
                    value={quantityInput}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setQuantityInput(raw);
                      const val = product.is_sold_by_unit ? parseFloat(raw) : parseInt(raw, 10);
                      if (!isNaN(val) && val > 0) {
                        const clamped = product.stock !== null ? Math.min(val, product.stock) : val;
                        setQuantity(clamped);
                      }
                    }}
                    onBlur={() => {
                      let val = product.is_sold_by_unit ? parseFloat(quantityInput) : parseInt(quantityInput, 10);
                      if (isNaN(val) || val < minQuantity) val = minQuantity;
                      if (product.stock !== null && val > product.stock) val = product.stock;
                      setQuantity(val);
                      setQuantityInput(val.toString());
                    }}
                    className="qty-input"
                    min={minQuantity}
                    max={product.stock ?? undefined}
                  />
                  {product.is_sold_by_unit && <span className="qty-unit-label">{unitLabel}</span>}
                  <button
                    onClick={() => {
                      const next = product.stock !== null ? Math.min(product.stock, quantity + 1) : quantity + 1;
                      setQuantity(next);
                      setQuantityInput(next.toString());
                    }}
                    disabled={product.stock !== null && quantity >= product.stock}
                  >
                    +
                  </button>
                </div>
                <span className="product-stock-note">
                  {outOfStock ? "ناموجود" : product.stock !== null ? `${product.stock.toLocaleString("fa-IR")} عدد موجود` : "موجود در انبار"}
                </span>
              </div>
              {product.has_min_order_quantity && product.min_order_quantity && (
                <p className="min-order-note">حداقل تعداد سفارش این محصول: {product.min_order_quantity.toLocaleString("fa-IR")} {unitLabel}</p>
              )}

              <p className="qty-total-preview">
                جمع کل: <b>{(finalPrice * quantity).toLocaleString("fa-IR")} تومان</b>
                <span className="qty-total-preview-detail">
                  ({quantity.toLocaleString("fa-IR")} {unitLabel} × {finalPrice.toLocaleString("fa-IR")} تومان)
                </span>
              </p>

              {pointsToEarn > 0 && (
                <div className="points-earn-badge">
                  🎁 با خرید این محصول <b>{pointsToEarn.toLocaleString("fa-IR")} امتیاز</b> می‌گیری!
                  <span>(معادل {(pointsToEarn * pointValueToman).toLocaleString("fa-IR")} تومان اعتبار برای خرید بعدی)</span>
                </div>
              )}

              <div className="product-buy-row">
                <button className="product-buy-btn" onClick={handleAddToCart} disabled={outOfStock}>
                  {added ? (
                    <>
                      <Check size={18} /> به سبد اضافه شد
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={18} />
                      {outOfStock ? "ناموجود" : "افزودن به سبد"}
                    </>
                  )}
                </button>
                <div className="product-price">
                  {hasDiscount && <span className="product-price-old">{product.price.toLocaleString("fa-IR")}</span>}
                  <div className="product-price-value">{finalPrice.toLocaleString("fa-IR")}</div>
                  <span className="product-price-unit">تومان {product.is_sold_by_unit ? `/ هر ${unitLabel}` : ""}</span>
                </div>
              </div>
            </>
          )}

          {showChina && (
            <div className="china-order-box">
              <div className="china-order-header">
                <Ship size={17} />
                <span>خرید و سفارش از چین</span>
              </div>
              {chinaDeliveryText && (
                <div className="china-order-delivery">
                  <Clock size={14} /> زمان تقریبی تحویل: <b>{chinaDeliveryText}</b>
                </div>
              )}
              <div className="china-order-price">
                {(product.china_price ?? 0).toLocaleString("fa-IR")} <span>تومان</span>
              </div>

              <div className="china-order-terms-row">
                <button
                  type="button"
                  onClick={() => setShowChinaTerms(true)}
                  className="text-blue-600 underline text-xs font-bold"
                >
                  قبل از سفارش، قوانین را مطالعه فرمایید
                </button>

                <label className="flex items-start gap-2 text-xs text-gray-700 cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    checked={chinaTermsAccepted}
                    onChange={(e) => setChinaTermsAccepted(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>با انتخاب این گزینه، قوانین سفارش مدت‌دار را می‌پذیرم.</span>
                </label>
              </div>

              <button
                className="product-buy-btn china-order-btn"
                onClick={handleAddChinaOrderToCart}
                disabled={!chinaTermsAccepted || !product.china_price}
              >
                {chinaAdded ? (
                  <>
                    <Check size={18} /> به سبد سفارش از چین اضافه شد
                  </>
                ) : (
                  <>
                    <Ship size={18} /> ثبت سفارش از چین
                  </>
                )}
              </button>
              <p className="china-order-note">
                این سفارش در فاکتور جداگانه‌ای از سفارش‌های موجود سایت ثبت و پردازش می‌شود.
              </p>
              {showChinaTerms && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                  onClick={() => setShowChinaTerms(false)}
                >
                  <div
                    className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                      <h3 className="font-bold text-gray-900">
                        قوانین سفارش مدت‌دار
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowChinaTerms(false)}
                        className="text-gray-500 hover:text-gray-800 text-lg"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="overflow-y-auto p-4 text-sm text-gray-700 leading-7">
                      {chinaTermsMessage}
                    </div>

                    <div className="p-3 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => setShowChinaTerms(false)}
                        className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
                      >
                        بستن
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="product-description">
            <h3 className="product-section-title">اطلاعات محصول</h3>
            {product.short_description && (
              <p className="product-description-text" style={{ fontWeight: 600, marginBottom: 10 }}>{product.short_description}</p>
            )}
            <p className="product-description-text" style={{ whiteSpace: "pre-line" }}>{product.description}</p>
            {product.description_images && product.description_images.length > 0 && (
              <div className="description-images-grid">
                {product.description_images.map((img, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={img} alt="" onClick={() => window.open(img, "_blank")} />
                ))}
              </div>
            )}
          </div>

          {attributes.length > 0 && (
            <div className="product-description">
              <h3 className="product-section-title">مشخصات فنی</h3>
              <table className="qty-tiers-table">
                <tbody>
                  {attributes.map((a) => (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 600, width: "40%" }}>{a.attr_key}</td>
                      <td>{a.attr_value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <RelatedArticlesForProduct posts={relatedArticles} />
        </div>
      </div>
    </div>
  );
}