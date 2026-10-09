"use server";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath, updateTag } from "next/cache";
import { normalizePageImages, type PageImage } from "@/lib/pageImages";

export async function updatePageImages(input: { about: PageImage[]; contact: PageImage[] }) {
  await requireAdmin();

  // اعتبارسنجی و پاک‌سازی سمت سرور (آدرس، اندازه، تراز و جایگاه)
  const about = normalizePageImages(input?.about, "about");
  const contact = normalizePageImages(input?.contact, "contact");

  const admin = createAdminClient();
  const { error } = await admin
    .from("site_settings")
    .update({ about_images: about, contact_images: contact })
    .eq("id", 1);
  if (error) return { error: error.message };

  revalidatePath("/about");
  revalidatePath("/contact");
  updateTag("settings");
  return { success: true };
}