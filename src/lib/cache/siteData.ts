import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { createAdminClient } from "@/lib/supabase/admin";

const PRODUCT_CARD_FIELDS = "id, name, slug, price, discount_price, stock, images, is_stock, name_en, rating_avg, rating_count";
const VISIBLE = "partner_id.is.null,partner_approval_status.eq.APPROVED";

export const getHomeCategories = unstable_cache(async () => {
  const { data, error } = await createPublicClient()
    .from("categories").select("*").is("parent_id", null).eq("is_active", true).order("name");
  if (error) throw error;
  return { data };
}, ["home-categories"], { revalidate: 3600, tags: ["categories"] });

async function homeProducts(flag: string, limit: number) {
  const { data, error } = await createPublicClient()
    .from("products").select(PRODUCT_CARD_FIELDS)
    .eq("is_active", true).eq(flag, true).or(VISIBLE)
    .order("created_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return { data };
}
export const getHomeNewest = unstable_cache(() => homeProducts("show_in_newest", 20), ["home-newest"], { revalidate: 60, tags: ["products"] });
export const getHomeDeals = unstable_cache(() => homeProducts("is_deal", 20), ["home-deals"], { revalidate: 60, tags: ["products"] });
export const getHomePopular = unstable_cache(() => homeProducts("is_popular", 20), ["home-popular"], { revalidate: 60, tags: ["products"] });
export const getHomeStock = unstable_cache(() => homeProducts("is_stock", 12), ["home-stock"], { revalidate: 60, tags: ["products"] });

async function homeBanners(position: string, limit?: number) {
  let q = createPublicClient().from("banners").select("*")
    .eq("is_active", true).eq("position", position).order("sort_order");
  if (limit) q = q.limit(limit);
  const { data, error } = await q;
  if (error) throw error;
  return { data };
}
export const getHomeBanners = unstable_cache(homeBanners, ["home-banners"], { revalidate: 300, tags: ["banners"] });

export const getHomeSettings = unstable_cache(async () => {
  const { data, error } = await createPublicClient()
    .from("site_settings")
    .select("deals_enabled, deals_banner_image, deals_banner_link, new_products_banner_image, new_products_banner_link, stock_enabled, total_site_visits")
    .eq("id", 1).single();
  if (error) throw error;
  return { data };
}, ["home-settings"], { revalidate: 300, tags: ["settings"] });

export const getHomeCounts = unstable_cache(async () => {
  const pub = createPublicClient();
  const admin = createAdminClient();
  const [p, u, pa, s] = await Promise.all([
    pub.from("products").select("*", { count: "exact", head: true }).eq("is_active", true).or(VISIBLE),
    admin.from("profiles").select("*", { count: "exact", head: true }).eq("role", "USER"),
    admin.from("partners").select("*", { count: "exact", head: true }),
    pub.rpc("get_total_stock"),
  ]);
  if (p.error || u.error || pa.error || s.error) throw new Error("home counts failed");
  return {
    products: p.count ?? 0,
    users: u.count ?? 0,
    partners: pa.count ?? 0,
    totalStock: Number(s.data ?? 0),
  };
}, ["home-counts"], { revalidate: 900, tags: ["products", "counts"] });

export const getHeaderData = unstable_cache(async () => {
  const pub = createPublicClient();
  const [c, a, s] = await Promise.all([
    pub.from("categories").select("id, name, slug").is("parent_id", null).eq("is_active", true).order("name"),
    pub.from("categories").select("id, name, slug, parent_id").eq("is_active", true).order("name"),
    pub.from("site_settings").select("logo_url, auction_header_enabled, auction_header_label").eq("id", 1).single(),
  ]);
  if (c.error || a.error || s.error) throw new Error("header data failed");
  return { categories: c.data, allCategories: a.data, settings: s.data };
}, ["header-data"], { revalidate: 3600, tags: ["categories", "settings"] });