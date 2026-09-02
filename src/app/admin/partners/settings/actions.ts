"use server";
import { createAdminClient } from "@/lib/supabase/admin";
import { uploadImage } from "@/lib/arvan";
import { revalidatePath } from "next/cache";
import sharp from "sharp";

export async function updatePartnerSettingsAction(formData: FormData) {
  const admin = createAdminClient();
  await admin.from("partner_settings").update({
    min_profit_percent: Number(formData.get("min_profit_percent")) || 15,
    settlement_hold_days: Number(formData.get("settlement_hold_days")) || 7,
    reserve_balance_amount: Number(formData.get("reserve_balance_amount")) || 0,
    min_withdrawal_amount: Number(formData.get("min_withdrawal_amount")) || 200000,
    registration_open: formData.get("registration_open") === "on",
    ai_default_prompt: String(formData.get("ai_default_prompt") || ""),
    ai_rotation_mode: String(formData.get("ai_rotation_mode") || "SEQUENTIAL"),
    partner_terms_text: String(formData.get("partner_terms_text") || ""),
    auto_suspend_after_violations: Number(formData.get("auto_suspend_after_violations")) || 3,
    auto_rating_enabled: formData.get("auto_rating_enabled") === "on",
  }).eq("id", 1);
  revalidatePath("/admin/partners/settings");
}

export async function uploadFrameTemplateAction(formData: FormData) {
  const admin = createAdminClient();
  const file = formData.get("file") as File | null;

  const payload: Record<string, unknown> = {
    frame_center_x: Number(formData.get("frame_center_x")) || 25,
    frame_center_y: Number(formData.get("frame_center_y")) || 25,
    frame_center_width: Number(formData.get("frame_center_width")) || 50,
    frame_center_height: Number(formData.get("frame_center_height")) || 50,
  };

  if (file && file.size > 0) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const png = await sharp(buffer).png().toBuffer(); // حفظ آلفا؛ به webp تبدیل نمی‌کنیم که شفافیت از بین نره
    const url = await uploadImage(
      png,
      `partners/frame-${Date.now()}.png`,
      "image/png"
    );
    payload.frame_template_url = url;
  }

  await admin.from("partner_settings").update(payload).eq("id", 1);
  await admin.from("partner_product_image_sources").update({ needs_regeneration: true, regeneration_attempts: 0 });
  revalidatePath("/admin/partners/settings");
}

export async function addAiKeyAction(formData: FormData) {
  const admin = createAdminClient();
  await admin.from("partner_ai_keys").insert({
    label: String(formData.get("label") || ""),
    api_key: String(formData.get("api_key") || ""),
    priority: Number(formData.get("priority")) || 1,
  });
  revalidatePath("/admin/partners/settings");
}

export async function deleteAiKeyAction(id: string) {
  const admin = createAdminClient();
  await admin.from("partner_ai_keys").delete().eq("id", id);
  revalidatePath("/admin/partners/settings");
}

export async function triggerImageRegenerationAction() {
  const { regenerateAllPartnerProductImages } = await import("@/lib/partners/regenerateImages");
  try {
     const result = await regenerateAllPartnerProductImages(50);
    return { success: true, ...result };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "خطای نامشخص";
    return { error: message };
  }
}

export async function uploadWatermarkAction(formData: FormData) {
  const admin = createAdminClient();
  const file = formData.get("file") as File | null;

  const payload: Record<string, unknown> = {
    watermark_enabled: formData.get("watermark_enabled") === "on",
    watermark_opacity: Number(formData.get("watermark_opacity")) || 0.35,
    watermark_rotation: Number(formData.get("watermark_rotation")) || -30,
    watermark_scale_percent: Number(formData.get("watermark_scale_percent")) || 45,
  };

  if (file && file.size > 0) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const png = await sharp(buffer).png().toBuffer();
    const url = await uploadImage(png, `partners/watermark-${Date.now()}.png`,"image/png");
    payload.watermark_url = url;
  }

  await admin.from("partner_settings").update(payload).eq("id", 1);
  await admin.from("partner_product_image_sources").update({ needs_regeneration: true, regeneration_attempts: 0 });

  revalidatePath("/admin/partners/settings");
}