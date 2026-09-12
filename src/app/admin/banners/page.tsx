import { createClient } from "@/lib/supabase/server";
import BannerManager from "@/components/admin/BannerManager";

export default async function AdminBannersPage() {
  const supabase = await createClient();
  const { data: allBanners } = await supabase
    .from("banners")
    .select("*")
    .order("sort_order");

  const byPos = (p: string) => (allBanners ?? []).filter((b) => b.position === p);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* بخش بنر بالا — دست‌نخورده، دقیقاً مثل قبل */}
      <BannerManager banners={byPos("hero")} position="hero" title="بنر اسلایدی بالای صفحه اصلی" />

      {/* موارد ۱ تا ۴ */}
      <BannerManager banners={byPos("deals")} position="deals" title="بنر اسلایدی جشنواره تخفیف" />
      <BannerManager banners={byPos("newest")} position="newest" title="بنر اسلایدی جدیدترین محصولات" />
      <BannerManager banners={byPos("popular")} position="popular" title="بنر اسلایدی محصولات پرطرفدار" />
      <BannerManager banners={byPos("stock")} position="stock" title="بنر اسلایدی محصولات استوک" />
    </div>
  );
}