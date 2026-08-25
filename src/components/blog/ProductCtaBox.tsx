import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { BlogPostProduct } from "@/types/blog";

export default function ProductCtaBox({ product }: { product: BlogPostProduct | null }) {
  if (!product) return null;
  const finalPrice = product.discount_price ?? product.price;
  return (
    <div className="blog-product-cta">
      {product.images?.[0] && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={product.images[0]} alt={product.name} />
      )}
      <div className="blog-product-cta-body">
        <span className="blog-product-cta-label">محصول این مقاله</span>
        <h4>{product.name}</h4>
        <div className="blog-product-cta-price">
          {product.discount_price && <s>{product.price.toLocaleString("fa-IR")} تومان</s>}
          <strong>{finalPrice.toLocaleString("fa-IR")} تومان</strong>
        </div>
        <Link href={`/product/${product.slug}`} className="blog-product-cta-btn"><ShoppingCart size={16} /> مشاهده و خرید</Link>
      </div>
    </div>
  );
}