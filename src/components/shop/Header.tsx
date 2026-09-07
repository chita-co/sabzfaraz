import { createClient } from "@/lib/supabase/server";
import HeaderNav from "./HeaderNav";
import { getPriceSnapshot } from "@/lib/priceTicker/cache";
import { extractHeaderPrices } from "@/lib/priceTicker/headerSummary";

export default async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile: { full_name: string | null; role: string } | null = null;
  if (user) {
    const { data } = await supabase.from("profiles").select("full_name, role").eq("id", user.id).single();
    profile = data;
  }

  const [{ data: categories }, { data: allCategories }, { data: settings }, { data: fullProfile }, priceSnapshot] = await Promise.all([
    supabase.from("categories").select("id, name, slug").is("parent_id", null).eq("is_active", true).order("name"),
    supabase.from("categories").select("id, name, slug, parent_id").eq("is_active", true).order("name"),
    supabase.from("site_settings").select("logo_url, auction_header_enabled, auction_header_label").eq("id", 1).single(),
    user ? supabase.from("profiles").select("wallet_balance").eq("id", user.id).single() : Promise.resolve({ data: null }),
    getPriceSnapshot().catch(() => null),
  ]);

  const headerPrices = priceSnapshot ? extractHeaderPrices(priceSnapshot) : undefined;
  const walletBalance = fullProfile?.wallet_balance ?? 0;

  const categoryTree = (categories ?? []).map((top) => ({
    id: top.id,
    name: top.name,
    slug: top.slug,
    children: (allCategories ?? [])
      .filter((c) => c.parent_id === top.id)
      .map((c) => ({ id: c.id, name: c.name, slug: c.slug })),
  }));

  return (
    <div style={{ position: "relative", zIndex: 100, isolation: "isolate" }}>
      <HeaderNav
      isLoggedIn={!!user}
      userName={profile?.full_name ?? null}
      isAdmin={profile?.role === "ADMIN"}
      categories={categories ?? []}
      categoryTree={categoryTree}
      logoUrl={settings?.logo_url ?? null}
      walletBalance={walletBalance}
      auctionEnabled={settings?.auction_header_enabled ?? true}
      auctionLabel={settings?.auction_header_label ?? "جمعه بازار"}
      prices={headerPrices}
      />
    </div>
  );
}