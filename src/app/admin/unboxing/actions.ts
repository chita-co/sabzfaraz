"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { extractVideoId, buildThumbnailUrl } from "@/lib/unboxing/videoHelpers";
import { creditWallet } from "@/lib/wallet/creditWallet";
import { createNotification } from "@/lib/notifications";
import { sendSms } from "@/lib/sms";

interface CreateVideoInput {
  title: string;
  aparatInput: string;
  youtubeInput: string;
  instagramUrl: string;
  customerName: string | null;
  orderNumber: string | null;
  productId: string | null;
  rewardAmount: number;
}

export async function createUnboxingVideo(input: CreateVideoInput) {
  const supabase = await createClient();

  const aparatId = input.aparatInput ? extractVideoId("aparat", input.aparatInput) : null;
  const youtubeId = input.youtubeInput ? extractVideoId("youtube", input.youtubeInput) : null;
  const instagramUrl = input.instagramUrl?.trim() || null;

  if (!aparatId && !youtubeId && !instagramUrl) {
    return { error: "حداقل یک لینک ویدیو (آپارات، یوتیوب یا اینستاگرام) الزامی است." };
  }

  const thumbnailUrl = aparatId
    ? buildThumbnailUrl("aparat", aparatId)
    : youtubeId
    ? buildThumbnailUrl("youtube", youtubeId)
    : null;

  let orderId: string | null = null;
  let userId: string | null = null;

  if (input.orderNumber) {
    const { data: order } = await supabase
      .from("orders").select("id, user_id").eq("order_number", input.orderNumber.trim()).maybeSingle();
    if (order) { orderId = order.id; userId = order.user_id; }
  }

  const { error } = await supabase.from("unboxing_videos").insert({
    title: input.title,
    platform: aparatId ? "aparat" : youtubeId ? "youtube" : "instagram",
    video_id: aparatId ?? youtubeId ?? "",
    aparat_video_id: aparatId,
    youtube_video_id: youtubeId,
    instagram_url: instagramUrl,
    thumbnail_url: thumbnailUrl,
    customer_name: input.customerName,
    order_number: input.orderNumber,
    order_id: orderId,
    user_id: userId,
    product_id: input.productId,
    reward_amount: input.rewardAmount,
  });

  if (error) return { error: error.message };
  revalidatePath("/admin/unboxing");
  return { success: true };
}

export async function approveAndPublish(videoId: string, rewardMethod: "wallet" | "manual") {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: video } = await admin.from("unboxing_videos").select("*").eq("id", videoId).single();
  if (!video) return { error: "ویدیو یافت نشد." };

  const { error } = await supabase.from("unboxing_videos").update({
    status: "PUBLISHED",
    published_at: new Date().toISOString(),
    reward_method: rewardMethod,
    reward_paid: true,
  }).eq("id", videoId);
  if (error) return { error: error.message };

  if (video.user_id) {
    if (rewardMethod === "wallet") {
      await creditWallet(video.user_id, video.reward_amount, `پاداش ویدیوی آنباکس «${video.title}»`);
    }
    await createNotification(
      video.user_id,
      "ویدیوت تأیید و منتشر شد! 🎬",
      `ویدیوی آنباکس «${video.title}» تأیید و منتشر شد و ${video.reward_amount.toLocaleString("fa-IR")} تومان پاداش ${rewardMethod === "wallet" ? "به کیف پولت واریز شد" : "برات در نظر گرفته شد"}.`
    );

    const { data: profile } = await admin.from("profiles").select("phone").eq("id", video.user_id).single();
    if (profile?.phone) {
      try {
        await sendSms(profile.phone, `سبزفراز\nویدیوی آنباکست تأیید شد! ${video.reward_amount.toLocaleString("fa-IR")} تومان پاداش گرفتی.`);
      } catch {}
    }
  }

  revalidatePath("/admin/unboxing");
  revalidatePath("/unboxing");
  return { success: true };
}

export async function rejectVideo(videoId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("unboxing_videos").update({ status: "REJECTED" }).eq("id", videoId);
  if (error) return { error: error.message };
  revalidatePath("/admin/unboxing");
  return { success: true };
}

export async function toggleFeatured(videoId: string, featured: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("unboxing_videos").update({ is_featured: featured }).eq("id", videoId);
  if (error) return { error: error.message };
  revalidatePath("/admin/unboxing");
  revalidatePath("/unboxing");
  return { success: true };
}

export async function deleteUnboxingVideo(videoId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("unboxing_videos").delete().eq("id", videoId);
  if (error) return { error: error.message };
  revalidatePath("/admin/unboxing");
  return { success: true };
}