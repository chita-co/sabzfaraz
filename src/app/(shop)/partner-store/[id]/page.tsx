import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/shop/ProductCard";
import { Star } from "lucide-react";
import type { Product } from "@/types";
import PartnerBioAccordion from "@/components/shop/PartnerBioAccordion";

export default async function PartnerStorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: partner } = await supabase.from("partners").select("business_name, logo_url, bio, rating_avg").eq("id", id).eq("status", "ACTIVE").single();
  if (!partner) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: products } = await supabase.from("products").select("*").eq("partner_id", id).eq("is_active", true).order("created_at", { ascending: false });

  let wishlistIds = new Set<string>();
  if (user && products && products.length > 0) {
    const { data: wishRows } = await supabase.from("wishlists").select("product_id").eq("user_id", user.id).in("product_id", products.map((p) => p.id));
    wishlistIds = new Set((wishRows ?? []).map((w) => w.product_id));
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, background: "#fff", padding: 20, borderRadius: 16, border: "1px solid #e5e7eb" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {partner.logo_url && <img src={partner.logo_url} alt={partner.business_name} style={{ width: 72, height: 72, borderRadius: 12, objectFit: "cover" }} />}
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800 }}>{partner.business_name}</h1>
          <p style={{ fontSize: 13, color: "#f59e0b", display: "flex", alignItems: "center", gap: 4 }}><Star size={14} fill="#f59e0b" /> {partner.rating_avg.toFixed(1)} از ۵</p>
          {partner.bio && <PartnerBioAccordion bio={partner.bio} />}
        </div>
      </div>

      {(() => {
  const rows: Product[][] = [];
  const list = (products ?? []) as Product[];
  for (let i = 0; i < list.length; i += 10) rows.push(list.slice(i, i + 10));
  return rows.map((row, rowIndex) => (
    <div className="deals-scroll" key={rowIndex}>
      {row.map((p) => (
        <div className="deals-scroll-item" key={p.id}>
          <ProductCard product={p} isWishlisted={wishlistIds.has(p.id)} />
        </div>
      ))}
    </div>
  ));
})()}
      {(!products || products.length === 0) && <p className="text-gray-500 text-center py-10">این همکار هنوز محصولی منتشر نکرده است.</p>}
    </div>
  );
}