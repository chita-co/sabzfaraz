import { createClient } from "@/lib/supabase/server";
import SiteAssetsManager from "@/components/admin/SiteAssetsManager";

export default async function AdminSiteSettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("logo_url, deals_banner_image, deals_banner_link, new_products_banner_image, new_products_banner_link")
    .eq("id", 1)
    .single();

  return (
    <SiteAssetsManager
      initialLogo={data?.logo_url ?? null}
      initialDealsBannerImage={data?.deals_banner_image ?? null}
      initialDealsBannerLink={data?.deals_banner_link ?? null}
      initialNewProductsBannerImage={data?.new_products_banner_image ?? null}
      initialNewProductsBannerLink={data?.new_products_banner_link ?? null}
    />
  );
}