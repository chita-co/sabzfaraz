"use server";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath, updateTag } from "next/cache";
import { deleteImageByUrl } from "@/lib/arvan";

export async function createBanner(
  position: string,
  imageUrl: string,
  linkUrl: string,
  sortOrder: number
) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("banners").insert({
    position,
    image_url: imageUrl,
    link_url: linkUrl || null,
    sort_order: sortOrder,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/banners");
  updateTag("banners");
  revalidatePath("/");
  return { success: true };
}

export async function toggleBannerActive(id: string, isActive: boolean) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("banners")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/banners");
  updateTag("banners");
  revalidatePath("/");
  return { success: true };
}

export async function deleteBanner(id: string, imageUrl: string) {
  await requireAdmin();
  const supabase = await createClient();
  await deleteImageByUrl(imageUrl);
  const { error } = await supabase.from("banners").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/banners");
  updateTag("banners");
  revalidatePath("/");
  return { success: true };
}