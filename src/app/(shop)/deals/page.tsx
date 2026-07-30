import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/shop/ProductCard";
import { Product } from "@/types";

export default async function DealsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: products }, { data: wishlistRows }] = await Promise.all([
    supabase.from("products").select("*").eq("is_active", true).eq("is_deal", true).order("created_at", { ascending: false }),
    user ? supabase.from("wishlists").select("product_id").eq("user_id", user.id) : Promise.resolve({ data: [] as { product_id: string }[] }),
  ]);

  const wishlistIds = new Set((wishlistRows ?? []).map((w) => w.product_id));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-xl font-bold text-red-600">🔥 جشنواره تخفیف</h1>
      {products && products.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {(products as Product[]).map((p) => (
            <ProductCard key={p.id} product={p} isWishlisted={wishlistIds.has(p.id)} />
          ))}
        </div>
      ) : (
        <p className="text-gray-500">در حال حاضر محصولی در جشنواره تخفیف قرار ندارد.</p>
      )}
    </div>
  );
}