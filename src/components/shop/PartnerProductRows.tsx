import ProductCard from "./ProductCard";
import { Product } from "@/types";
import DragScrollRow from "@/components/shared/DragScrollRow";

export default function PartnerProductRows({
  products,
  wishlistIds,
}: {
  products: Product[];
  wishlistIds: Set<string>;
}) {
  if (!products || products.length === 0) return null;
  const rows: Product[][] = [];
  for (let i = 0; i < products.length; i += 10) rows.push(products.slice(i, i + 10));

  return (
    <>
      {rows.map((row, rowIndex) => (
        <div className="deals-scroll" key={rowIndex}>
          {row.map((p) => (
            <DragScrollRow className="deals-scroll-item" key={p.id}>
              <ProductCard product={p} isWishlisted={wishlistIds.has(p.id)} />
            </DragScrollRow>
          ))}
        </div>
      ))}
    </>
  );
}