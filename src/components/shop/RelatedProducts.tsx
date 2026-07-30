import Link from "next/link";
import ProductCard from "./ProductCard";
import { Product } from "@/types";

export default function RelatedProducts({
  products,
  wishlistIds,
  categoryHref,
}: {
  products: Product[];
  wishlistIds: Set<string>;
  categoryHref: string;
}) {
  if (products.length === 0) return null;

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title">کالاهای مشابه</h2>
        <Link href={categoryHref} className="deal-see-all">مشاهده همه</Link>
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