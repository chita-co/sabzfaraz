"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { deleteImageByUrl } from "@/lib/arvan";

export async function createBanner(
  imageUrl: string,
  linkUrl: string,
  sortOrder: number
) {
  const supabase = await createClient();
  const { error } = await supabase.from("banners").insert({
    image_url: imageUrl,
    link_url: linkUrl || null,
    sort_order: sortOrder,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/banners");
  revalidatePath("/");
  return { success: true };
}

export async function toggleBannerActive(id: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("banners")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/banners");
  revalidatePath("/");
  return { success: true };
}

export async function deleteBanner(id: string, imageUrl: string) {
  const supabase = await createClient();
  await deleteImageByUrl(imageUrl);
  const { error } = await supabase.from("banners").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/banners");
  revalidatePath("/");
  return { success: true };
}