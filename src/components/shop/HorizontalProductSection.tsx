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

  // محصولات را به گروه‌های ۱۰تایی تقسیم می‌کنیم تا هر گروه یک ردیف اسکرول‌شونده‌ی
  // افقی جدا باشد. اگر محصولات کم باشند فقط همان یک ردیف نمایش داده می‌شود و اگر
  // بعداً تعدادشان بیشتر شود، خودش به‌صورت خودکار ردیف دوم/سوم را هم نشان می‌دهد.
  const rows: Product[][] = [];
  for (let i = 0; i < products.length; i += 10) {
    rows.push(products.slice(i, i + 10));
  }

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title">{title}</h2>
        <Link href={seeAllHref} className="deal-see-all">مشاهده همه</Link>
      </div>
      {rows.map((row, rowIndex) => (
        <div className="deals-scroll" key={rowIndex}>
          {row.map((p) => (
            <div className="deals-scroll-item" key={p.id}>
              <ProductCard product={p} isWishlisted={wishlistIds.has(p.id)} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}