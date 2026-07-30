import Link from "next/link";
import { Product } from "@/types";
import ProductCard from "./ProductCard";

export default function DealsSection({
  products,
  wishlistIds = new Set(),
}: {
  products: Product[];
  wishlistIds?: Set<string>;
}) {
  if (products.length === 0) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title deal-title">🔥 جشنواره تخفیف</h2>
        <Link href="/deals" className="deal-see-all">مشاهده همه</Link>
      </div>
      <div className="deals-scroll">
        {products.map((p) => (
          <div className="deals-scroll-item" key={p.id}>
            <ProductCard product={p} isWishlisted={wishlistIds.has(p.id)} />
          </div>
        ))}
      </div>
    </div>
  );
}