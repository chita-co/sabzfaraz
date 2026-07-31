import Link from "next/link";
import ProductCard from "./ProductCard";
import { Product } from "@/types";

export default function HorizontalProductSection({
  title,
  seeAllHref,
  products,
  wishlistIds,
}: {
  title: string;
  seeAllHref: string;
  products: Product[];
  wishlistIds: Set<string>;
}) {
  if (products.length === 0) return null;

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title">{title}</h2>
        <Link href={seeAllHref} className="deal-see-all">مشاهده همه</Link>
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