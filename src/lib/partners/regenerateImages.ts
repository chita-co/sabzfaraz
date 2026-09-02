import { createAdminClient } from "@/lib/supabase/admin";
import { uploadImage } from "@/lib/arvan";
import sharp from "sharp";

export async function regenerateAllPartnerProductImages(limit = 20) {
  const admin = createAdminClient();
  const { data: settings } = await admin.from("partner_settings").select("*").eq("id", 1).single();
  if (!settings?.frame_template_url) throw new Error("قالب تصویر تنظیم نشده است.");

  const frameRes = await fetch(settings.frame_template_url);
  const frameBuffer = Buffer.from(await frameRes.arrayBuffer());
  const outputSize = settings.frame_output_size;

  const centerXpx = Math.round((settings.frame_center_x / 100) * outputSize);
  const centerYpx = Math.round((settings.frame_center_y / 100) * outputSize);
  const centerWpx = Math.round((settings.frame_center_width / 100) * outputSize);
  const centerHpx = Math.round((settings.frame_center_height / 100) * outputSize);

  const frameResized = await sharp(frameBuffer).resize(outputSize, outputSize).ensureAlpha().toBuffer();

  // لایه‌ی واترمارک (اگر فعال باشد) — یک‌بار ساخته می‌شود و برای همه‌ی تصاویر همین دسته استفاده می‌شود
  let watermarkLayer: Buffer | null = null;
  if (settings.watermark_enabled && settings.watermark_url) {
    try {
      const wmRes = await fetch(settings.watermark_url);
      const wmRawBuffer = Buffer.from(await wmRes.arrayBuffer());
      const wmTargetWidth = Math.round((settings.watermark_scale_percent / 100) * outputSize);

      const wmResized = await sharp(wmRawBuffer).resize({ width: wmTargetWidth }).ensureAlpha().toBuffer();
      const wmRotated = await sharp(wmResized)
        .rotate(settings.watermark_rotation, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .linear([1, 1, 1, settings.watermark_opacity], [0, 0, 0, 0])
        .toBuffer();
      const wmRotatedMeta = await sharp(wmRotated).metadata();
      const wmW = wmRotatedMeta.width ?? wmTargetWidth;
      const wmH = wmRotatedMeta.height ?? wmTargetWidth;

      watermarkLayer = await sharp({
        create: { width: outputSize, height: outputSize, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
      })
        .composite([{ input: wmRotated, left: Math.round((outputSize - wmW) / 2), top: Math.round((outputSize - wmH) / 2) }])
        .png()
        .toBuffer();
    } catch (e) {
      console.error("خطا در ساخت لایه‌ی واترمارک:", e);
      watermarkLayer = null;
    }
  }

  const { data: sources } = await admin
    .from("partner_product_image_sources")
    .select("*")
    .eq("needs_regeneration", true)
    .lt("regeneration_attempts", 3)
    .order("created_at", { ascending: true })
    .limit(limit);
  let successCount = 0, failCount = 0;

  for (const src of sources ?? []) {
    try {
      const rawRes = await fetch(src.raw_crop_url);
      const rawBuffer = Buffer.from(await rawRes.arrayBuffer());
      const resizedCrop = await sharp(rawBuffer).resize(centerWpx, centerHpx, { fit: "cover" }).toBuffer();

      const compositeLayers: { input: Buffer; left: number; top: number }[] = [
        { input: resizedCrop, left: centerXpx, top: centerYpx },
        { input: frameResized, left: 0, top: 0 },
      ];
      if (watermarkLayer) compositeLayers.push({ input: watermarkLayer, left: 0, top: 0 });

      const finalBuffer = await sharp({
        create: { width: outputSize, height: outputSize, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
      })
        .composite(compositeLayers)
        .webp({ quality: 90 })
        .toBuffer();

      const newUrl = await uploadImage(finalBuffer, `partners/products/regenerated-${src.id}-${Date.now()}.webp`);
      await admin.from("partner_product_image_sources").update({
        final_image_url: newUrl,
        needs_regeneration: false,
        regeneration_attempts: 0,
      }).eq("id", src.id);

      const { data: product } = await admin.from("products").select("id, images").eq("id", src.product_id).single();
      if (product) {
        const updatedImages = (product.images as string[]).map((img) => (img === src.final_image_url ? newUrl : img));
        await admin.from("products").update({ images: updatedImages }).eq("id", product.id);
      }
      successCount++;
    } catch (e) {
      console.error(`خطا در بازتولید تصویر محصول ${src.product_id}:`, e);
      await admin.from("partner_product_image_sources").update({
        regeneration_attempts: (src.regeneration_attempts ?? 0) + 1,
      }).eq("id", src.id);
      failCount++;
    }
  }
  const { count: remaining } = await admin
    .from("partner_product_image_sources")
    .select("id", { count: "exact", head: true })
    .eq("needs_regeneration", true)
    .lt("regeneration_attempts", 3);

  return {
    successCount,
    failCount,
    total: (sources ?? []).length,
    remaining: remaining ?? 0,
  };
}