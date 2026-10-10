"use server";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath, updateTag } from "next/cache";
import { normalizePageImages, type PageImage } from "@/lib/pageImages";

export async function updatePageImages(input: {
  about: PageImage[];
  contact: PageImage[];
  unboxing?: PageImage[];
  gallery?: PageImage[];
}) {
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

  // انباکس و گالری در آپدیت جدا ذخیره می‌شوند تا مشکل احتمالی آن‌ها، ذخیره‌ی «درباره ما» و «تماس با ما» را خراب نکند
  if (input?.unboxing !== undefined || input?.gallery !== undefined) {
    const patch: Record<string, PageImage[]> = {};
    if (input.unboxing !== undefined) patch.unboxing_images = normalizePageImages(input.unboxing, "unboxing");
    if (input.gallery !== undefined) patch.gallery_images = normalizePageImages(input.gallery, "gallery");
    const { error: error2 } = await admin.from("site_settings").update(patch).eq("id", 1);
    if (error2) {
      return { error: "ذخیره‌ی تصاویر انباکس/گالری ناموفق بود (آیا SQL ستون‌ها اجرا شده است؟): " + error2.message };
    }
  }

  revalidatePath("/about");
  revalidatePath("/contact");
  revalidatePath("/unboxing");
  revalidatePath("/gallery");
  updateTag("settings");
  return { success: true };
}