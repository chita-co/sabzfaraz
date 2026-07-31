"use client";

import { useState } from "react";
import Image from "next/image";
import { Share2, ShoppingCart, Check } from "lucide-react";
import { Product, ProductQuantityTier } from "@/types";
import { useCartStore } from "@/store/cart-store";
import WishlistButton from "./WishlistButton";
import { StarRatingDisplay } from "./StarRating";

export default function ProductDetail({
  product,
  isWishlisted,
  avgRating = 0,
  reviewCount = 0,
  quantityTiers = [],
}: {
  product: Product;
  isWishlisted: boolean;
  avgRating?: number;
  reviewCount?: number;
  quantityTiers?: ProductQuantityTier[];
}) {
  const [activeImage, setActiveImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string | null>(product.colors?.[0]?.name ?? null);
  const [selectedSize, setSelectedSize] = useState<string | null>(product.sizes?.[0] ?? null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const addItem = useCartStore((s) => s.addItem);

  const matchedTier = quantityTiers.find((t) => quantity >= t.min_qty && quantity <= t.max_qty);
  const finalPrice = matchedTier ? matchedTier.unit_price : (product.discount_price ?? product.price);
  const hasDiscount = !!product.discount_price && product.discount_price < product.price && !matchedTier;
  const discountPercent = hasDiscount
    ? Math.round(100 - (product.discount_price! / product.price) * 100)
    : 0;

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
          <div className="product-gallery-main relative">
            {product.images?.[activeImage] ? (
              <Image
                src={product.images[activeImage]}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="product-no-image">بدون تصویر</div>
            )}
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
                  className={`product-thumb relative${i === activeImage ? " active" : ""}`}
                  onClick={() => setActiveImage(i)}
                >
                  <Image
                    src={img}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="60px"
                  />
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

          <div className="product-description">
            <h3 className="product-section-title">اطلاعات محصول</h3>
            <p className="product-description-text">{product.description}</p>
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

          <div className="product-qty-row">
            <h3 className="product-section-title">تعداد</h3>
            <div className="product-qty-control">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1}>−</button>
              <span>{quantity}</span>
              <button
                onClick={() => setQuantity((q) => (product.stock !== null ? Math.min(product.stock, q + 1) : q + 1))}
                disabled={product.stock !== null && quantity >= product.stock}
              >
                +
              </button>
            </div>
            <span className="product-stock-note">
              {outOfStock
                ? "ناموجود"
                : product.stock !== null
                ? `${product.stock.toLocaleString("fa-IR")} عدد موجود`
                : "موجود در انبار"}
            </span>
          </div>

          {quantityTiers.length > 0 && (
            <div className="qty-tiers-box">
              <h3 className="product-section-title">تخفیف پلکانی بر اساس تعداد</h3>
              <table className="qty-tiers-table">
                <thead><tr><th>تعداد</th><th>قیمت واحد</th></tr></thead>
                <tbody>
                  {quantityTiers.map((t) => (
                    <tr key={t.id} className={matchedTier?.id === t.id ? "active" : ""}>
                      <td>{t.min_qty.toLocaleString("fa-IR")} تا {t.max_qty.toLocaleString("fa-IR")}</td>
                      <td>{t.unit_price.toLocaleString("fa-IR")} تومان</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
              <h1>{finalPrice.toLocaleString("fa-IR")}</h1>
              <span className="product-price-unit">تومان</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}