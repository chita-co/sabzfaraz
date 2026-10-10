import { createClient } from "@/lib/supabase/server";
import SiteAssetsManager from "@/components/admin/SiteAssetsManager";
import PageImagesManager from "@/components/admin/PageImagesManager";
import { normalizePageImages } from "@/lib/pageImages";

export default async function AdminSiteSettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("logo_url, deals_banner_image, deals_banner_link, new_products_banner_image, new_products_banner_link")
    .eq("id", 1)
    .single();

  // کوئری‌های جدا: اگر ستون‌های تصاویر هنوز ساخته نشده باشند، بقیه‌ی تنظیمات سایت از کار نمی‌افتند
  const { data: pageImgs } = await supabase
    .from("site_settings")
    .select("about_images, contact_images")
    .eq("id", 1)
    .single();

  const { data: extraImgs } = await supabase
    .from("site_settings")
    .select("unboxing_images, gallery_images")
    .eq("id", 1)
    .single();

  return (
    <div className="space-y-5">
      <SiteAssetsManager
        initialLogo={data?.logo_url ?? null}
        initialDealsBannerImage={data?.deals_banner_image ?? null}
        initialDealsBannerLink={data?.deals_banner_link ?? null}
        initialNewProductsBannerImage={data?.new_products_banner_image ?? null}
        initialNewProductsBannerLink={data?.new_products_banner_link ?? null}
      />
      <PageImagesManager
        initialAbout={normalizePageImages(pageImgs?.about_images, "about")}
        initialContact={normalizePageImages(pageImgs?.contact_images, "contact")}
        initialUnboxing={normalizePageImages(extraImgs?.unboxing_images, "unboxing")}
        initialGallery={normalizePageImages(extraImgs?.gallery_images, "gallery")}
      />
    </div>
  );
}