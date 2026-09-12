"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { deleteImageByUrl } from "@/lib/arvan";

export async function createPromoAd(input: {
  imageUrl: string;
  title: string;
  description: string;
  linkUrl: string;
  sortOrder: number;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("promo_ads").insert({
    image_url: input.imageUrl,
    title: input.title || null,
    description: input.description || null,
    link_url: input.linkUrl || null,
    sort_order: input.sortOrder,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/promo-ads");
  revalidatePath("/");
  return { success: true };
}

export async function updatePromoAd(id: string, input: { title: string; description: string; linkUrl: string; sortOrder: number }) {
  const supabase = await createClient();
  const { error } = await supabase.from("promo_ads").update({
    title: input.title || null,
    description: input.description || null,
    link_url: input.linkUrl || null,
    sort_order: input.sortOrder,
  }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/promo-ads");
  revalidatePath("/");
  return { success: true };
}

export async function togglePromoAdActive(id: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("promo_ads").update({ is_active: isActive }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/promo-ads");
  revalidatePath("/");
  return { success: true };
}

export async function deletePromoAd(id: string, imageUrl: string) {
  const supabase = await createClient();
  await deleteImageByUrl(imageUrl);
  const { error } = await supabase.from("promo_ads").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/promo-ads");
  revalidatePath("/");
  return { success: true };
}