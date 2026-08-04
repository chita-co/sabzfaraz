import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { Product } from "@/types";
import WishlistButton from "./WishlistButton";
import QuickAddButton from "./QuickAddButton";

export default function ProductCard({
  product,
  isWishlisted = false,
}: {
  product: Product;
  isWishlisted?: boolean;
}) {
  const finalPrice = product.discount_price ?? product.price;
  const hasDiscount = !!product.discount_price && product.discount_price < product.price;
  const discountPercent = hasDiscount
    ? Math.round(100 - (product.discount_price! / product.price) * 100)
    : 0;
  const isOutOfStock = product.stock !== null && product.stock <= 0;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block overflow-hidden rounded-lg border border-gray-200 bg-white transition hover:shadow-md"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
        {isOutOfStock ? (
          <div className="out-of-stock-stamp">
            <div className="out-of-stock-stamp-inner">
              <span className="out-of-stock-stamp-text">متاسفانه <br />محصول تمام شد</span>
            </div>
          </div>
        ) : product.is_stock ? (
          <div className="absolute bottom-2 left-2 z-10" style={{ transform: 'rotate(0deg)' }}>
            <span
              className="stock-ribbon"
              style={{
                transform: 'rotate(0deg)',
                display: 'inline-block',
                position: 'static'
              }}
            >
              استوک
            </span>
          </div>
        ) : null}
        {product.images?.[0] ? (
          <Image src={product.images[0]} alt={product.name} fill sizes="(max-width: 768px) 50vw, 20vw" className="object-cover transition group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">بدون تصویر</div>
        )}
        {hasDiscount && (
          <span className="absolute right-2 top-2 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white shadow">
            {discountPercent}%-
          </span>
        )}
        <div className="absolute left-2 top-2">
          <WishlistButton productId={product.id} initialWishlisted={isWishlisted} size={16} />
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <h3 className="line-clamp-2 text-sm text-gray-800 flex-1">{product.name}</h3>
           {product.rating_count > 0 && (
            <span className="product-card-rating">
              <Star size={11} fill="#f59e0b" color="#f59e0b" />
              {product.rating_avg.toFixed(1)}
            </span>
          )}
        </div>
        {product.name_en && (
          <p dir="ltr" className="mb-2 text-xs text-gray-400 line-clamp-1">
            {product.name_en}
          </p>
        )}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through">{product.price.toLocaleString("fa-IR")}</span>
            )}
            <span className={hasDiscount ? "text-[15px] font-extrabold text-red-600" : "font-bold text-gray-900"}>
              {finalPrice.toLocaleString("fa-IR")} تومان
            </span>
          </div>
          <QuickAddButton product={product} />
        </div>
      </div>
    </Link>
  );
}