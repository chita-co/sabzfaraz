"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { extractVideoId } from "@/lib/unboxing/videoHelpers";
import { buildInstagramEmbedUrl } from "@/lib/gallery/galleryHelpers";

export async function getGalleryVideos() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("gallery_videos")
    .select("*")
    .order("platform", { ascending: true })
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function createGalleryVideo(input: {
  platform: "instagram" | "youtube" | "aparat";
  link: string;
  caption: string;
  coverImageUrl: string;
}) {
  const admin = createAdminClient();
  const link = input.link.trim();
  if (!link) return { error: "لینک ویدیو الزامی است." };

  let videoId: string | null = null;

  if (input.platform === "instagram") {
    if (!buildInstagramEmbedUrl(link)) {
      return { error: "لینک اینستاگرام معتبر نیست. باید شبیه https://www.instagram.com/reel/... یا /p/... باشد." };
    }
  } else {
    videoId = extractVideoId(input.platform, link);
    if (!videoId) return { error: "لینک یا شناسه‌ی ویدیو معتبر نیست." };
  }

  const { error } = await admin.from("gallery_videos").insert({
    platform: input.platform,
    video_url: link,
    video_id: videoId,
    caption: input.platform === "instagram" ? null : (input.caption.trim() || null),
    cover_image_url: input.coverImageUrl.trim() || null,
  });
  if (error) return { error: "خطا در ثبت ویدیو: " + error.message };

  revalidatePath("/admin/gallery");
  revalidatePath("/unboxing");
  return { success: true };
}

export async function deleteGalleryVideo(id: string) {
  const admin = createAdminClient();
  await admin.from("gallery_videos").delete().eq("id", id);
  revalidatePath("/admin/gallery");
  revalidatePath("/unboxing");
}