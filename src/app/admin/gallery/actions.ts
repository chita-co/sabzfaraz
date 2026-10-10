"use server";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { extractVideoId } from "@/lib/unboxing/videoHelpers";
import { buildInstagramEmbedUrl } from "@/lib/gallery/galleryHelpers";
import { deleteImageByUrl } from "@/lib/arvan";

const PLATFORMS = ["instagram", "youtube", "aparat"];
const ID_RE = /^[A-Za-z0-9_-]{1,64}$/; // شناسه‌ی ایمن (uuid یا عدد)

function revalidateGalleryPages() {
  revalidatePath("/admin/gallery");
  revalidatePath("/unboxing");
  revalidatePath("/gallery");
  revalidatePath("/sitemap.xml");
}

export async function getGalleryVideos() {
  await requireAdmin();
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
  await requireAdmin();

  // اعتبارسنجی ورودی سمت سرور (نوع‌ها فقط در زمان کامپایل تضمین می‌شوند)
  if (!PLATFORMS.includes(String(input?.platform))) return { error: "پلتفرم نامعتبر است." };
  const admin = createAdminClient();
  const link = String(input.link ?? "").trim().slice(0, 500);
  if (!link) return { error: "لینک ویدیو الزامی است." };

  let videoId: string | null = null;
  let storedUrl = link;

  if (input.platform === "instagram") {
    if (!buildInstagramEmbedUrl(link)) {
      return { error: "لینک اینستاگرام معتبر نیست. باید شبیه https://www.instagram.com/reel/... یا /p/... باشد." };
    }
    // آدرس استاندارد ذخیره می‌شود (نه متن خام ورودی)
    const m = link.match(/instagram\.com\/(reel|p|tv)\/([a-zA-Z0-9_-]+)/);
    if (!m) return { error: "لینک اینستاگرام معتبر نیست." };
    storedUrl = `https://www.instagram.com/${m[1]}/${m[2]}/`;
  } else {
    videoId = extractVideoId(input.platform, link);
    if (!videoId) return { error: "لینک یا شناسه‌ی ویدیو معتبر نیست." };
  }

  const caption = input.platform === "instagram" ? null : String(input.caption ?? "").trim().slice(0, 200) || null;

  const cover = String(input.coverImageUrl ?? "").trim();
  if (cover && !/^https:\/\//i.test(cover) && !/^\/(?!\/)/.test(cover)) {
    return { error: "آدرس تصویر کاور معتبر نیست." };
  }

  const { error } = await admin.from("gallery_videos").insert({
    platform: input.platform,
    video_url: storedUrl,
    video_id: videoId,
    caption,
    cover_image_url: cover || null,
  });
  if (error) return { error: "خطا در ثبت ویدیو: " + error.message };

  revalidateGalleryPages();
  return { success: true };
}

export async function deleteGalleryVideo(id: string) {
  await requireAdmin();
  if (!ID_RE.test(String(id))) return;
  const admin = createAdminClient();
  const { data: row } = await admin.from("gallery_videos").select("cover_image_url").eq("id", id).single();
  await admin.from("gallery_videos").delete().eq("id", id);
  const endpoint = process.env.ARVAN_ENDPOINT;
  if (row?.cover_image_url && endpoint && row.cover_image_url.startsWith(endpoint)) {
    await deleteImageByUrl(row.cover_image_url);
  }
  revalidateGalleryPages();
}