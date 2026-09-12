import { createClient } from "@/lib/supabase/server";
import PromoAdsManager from "@/components/admin/PromoAdsManager";

export default async function AdminPromoAdsPage() {
  const supabase = await createClient();
  const { data: promoAds } = await supabase.from("promo_ads").select("*").order("sort_order");
  return <PromoAdsManager promoAds={promoAds ?? []} />;
}