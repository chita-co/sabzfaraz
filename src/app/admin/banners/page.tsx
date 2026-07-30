import { createClient } from "@/lib/supabase/server";
import BannerManager from "@/components/admin/BannerManager";

export default async function AdminBannersPage() {
  const supabase = await createClient();
  const { data: banners } = await supabase
    .from("banners")
    .select("*")
    .order("sort_order");

  return <BannerManager banners={banners ?? []} />;
}