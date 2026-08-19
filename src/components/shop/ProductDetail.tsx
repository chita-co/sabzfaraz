"use client";

import { useState } from "react";
import { Share2, ShoppingCart, Check, ChevronDown } from "lucide-react";
import { Product, ProductQuantityTier } from "@/types";
import { useCartStore } from "@/store/cart-store";
import WishlistButton from "./WishlistButton";
import { StarRatingDisplay } from "./StarRating";
import { calculatePointsToEarn } from "@/lib/loyalty/points-utils";

export default function ProductDetail({
  product, isWishlisted, avgRating = 0, reviewCount = 0, quantityTiers = [],
  tomanPerPoint = 1000, pointsMultiplier = 1, pointValueToman = 100,
}: {
  product: Product; isWishlisted: boolean; avgRating?: number; reviewCount?: number; quantityTiers?: ProductQuantityTier[];
  tomanPerPoint?: number; pointsMultiplier?: number; pointValueToman?: number;
}) {
  const [activeImage, setActiveImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string | null>(product.colors?.[0]?.name ?? null);
  const [selectedSize, setSelectedSize] = useState<string | null>(product.sizes?.[0] ?? null);
  const minQuantity = product.has_min_order_quantity && product.min_order_quantity
    ? product.min_order_quantity
    : (product.is_sold_by_unit ? 0.1 : 1);
  const [quantity, setQuantity] = useState(minQuantity);
  const [quantityInput, setQuantityInput] = useState(String(minQuantity));
  const [added, setAdded] = useState(false);
  const [showTiersTable, setShowTiersTable] = useState(false);

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

  function handleAddToCart() {
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      image: product.images?.[0] ?? "",
      price: product.price,
      discountPrice: matchedTier ? matchedTier.unit_price : product.discount_price,
      selectedColor,
      selectedSize,
      quantity,
      stock: product.stock,
      weightGrams: product.weight_grams,
      unitLabel: product.is_sold_by_unit ? unitLabel : null,
      minQuantity: product.has_min_order_quantity && product.min_order_quantity
    ? product.min_order_quantity
    : (product.is_sold_by_unit ? 0.1 : 1),
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
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

  return (
    <div className="product-page" style={{ "--primary": accentColor } as React.CSSProperties}>
      <div className="product-card">
        <div className="product-gallery">
          <div className="product-gallery-main">
            {product.images?.[activeImage] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.images[activeImage]} alt={product.name} />
            ) : (
              <div className="product-no-image">بدون تصویر</div>
            )}
            {product.stock !== null && product.stock <= 0 ? (
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
            {hasDiscount && <span className="product-discount-badge">{discountPercent}%-</span>}
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

          {/* بخش قیمت پیش از انتخاب رنگ/سایز/تعداد — کمترین و بیشترین قیمت */}
          <div className="product-price-block">
            {lowestTier ? (
              <>
                <div className="price-lowest">
                  <h1>{lowestTier.unit_price.toLocaleString("fa-IR")} <span>تومان</span></h1>
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
                <h1>{finalPrice.toLocaleString("fa-IR")} <span>تومان</span></h1>
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

          <div className="product-buy-row"></div>


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
              <h1>{finalPrice.toLocaleString("fa-IR")}</h1>
              <span className="product-price-unit">تومان {product.is_sold_by_unit ? `/ هر ${unitLabel}` : ""}</span>
            </div>
          </div>

          <div className="product-description">
            <h3 className="product-section-title">اطلاعات محصول</h3>
            {product.short_description && (
              <p className="product-description-text" style={{ fontWeight: 600, marginBottom: 10 }}>{product.short_description}</p>
            )}
            <p className="product-description-text">{product.description}</p>
            {product.description_images && product.description_images.length > 0 && (
              <div className="description-images-grid">
                {product.description_images.map((img, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={img} alt="" onClick={() => window.open(img, "_blank")} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}