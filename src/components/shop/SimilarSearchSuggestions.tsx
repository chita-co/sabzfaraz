import ProductCard from "./ProductCard";
import { Product } from "@/types";

export default function SimilarSearchSuggestions({ products, wishlistIds }: { products: Product[]; wishlistIds: Set<string> }) {
  if (products.length === 0) return null;
  return (
    <div className="mt-8">
      <p className="text-gray-600 text-sm mb-4">آیا منظور شما این موارد بود؟</p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} isWishlisted={wishlistIds.has(product.id)} />
        ))}
      </div>
    </div>
  );
}