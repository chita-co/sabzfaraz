"use server";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath, updateTag } from "next/cache";

interface SiteAssetsInput {
  logoUrl: string | null;
  dealsBannerImage: string | null;
  dealsBannerLink: string;
  newProductsBannerImage: string | null;
  newProductsBannerLink: string;
}

export async function updateSiteAssets(input: SiteAssetsInput) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("site_settings")
    .update({
      logo_url: input.logoUrl,
      deals_banner_image: input.dealsBannerImage,
      deals_banner_link: input.dealsBannerLink || null,
      new_products_banner_image: input.newProductsBannerImage,
      new_products_banner_link: input.newProductsBannerLink || null,
    })
    .eq("id", 1);

  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  updateTag("settings");
  return { success: true };
}