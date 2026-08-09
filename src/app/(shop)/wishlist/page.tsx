import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/shop/ProductCard";
import Breadcrumb from "@/components/shop/Breadcrumb";
import { Product } from "@/types";
import { Heart } from "lucide-react";
import FloatingLinesBackground from "@/components/backgrounds/FloatingLinesBackground";

type WishlistRow = {
  product_id: string;
  products: Product | null;
};

export default async function WishlistPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: wishlistRows } = await supabase
    .from("wishlists")
    .select("product_id, products(*)")
    .eq("user_id", user.id);

  const products = (wishlistRows ?? [])
    .map((w) => (w as unknown as WishlistRow).products)
    .filter((p): p is Product => p !== null);

  return (
    <>
      <FloatingLinesBackground />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Breadcrumb theme="dark" items={[{ label: "علاقه‌مندی‌های من" }]} />

        <h1 className="mb-6 flex items-center gap-2 text-xl font-bold text-gray-900">
          <Heart size={20} className="text-red-500" />
          علاقه‌مندی‌های من
        </h1>
        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} isWishlisted />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">هنوز محصولی به علاقه‌مندی‌ها اضافه نکرده‌اید.</p>
        )}
      </div>
    </>
  );
}