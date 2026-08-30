import { createAdminClient } from "@/lib/supabase/admin";
import { uploadImage } from "@/lib/arvan";
import sharp from "sharp";

export async function regenerateAllPartnerProductImages() {
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

  const { data: sources } = await admin.from("partner_product_image_sources").select("*");
  let successCount = 0, failCount = 0;

  for (const src of sources ?? []) {
    try {
      const rawRes = await fetch(src.raw_crop_url);
      const rawBuffer = Buffer.from(await rawRes.arrayBuffer());
      const resizedCrop = await sharp(rawBuffer).resize(centerWpx, centerHpx, { fit: "cover" }).toBuffer();

      const finalBuffer = await sharp({
        create: { width: outputSize, height: outputSize, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
      })
        .composite([
          { input: resizedCrop, left: centerXpx, top: centerYpx },
          { input: frameResized, left: 0, top: 0 },
        ])
        .webp({ quality: 90 })
        .toBuffer();

      const newUrl = await uploadImage(finalBuffer, `partners/products/regenerated-${src.id}-${Date.now()}.webp`);
      await admin.from("partner_product_image_sources").update({ final_image_url: newUrl }).eq("id", src.id);

      const { data: product } = await admin.from("products").select("id, images").eq("id", src.product_id).single();
      if (product) {
        const updatedImages = (product.images as string[]).map((img) => (img === src.final_image_url ? newUrl : img));
        await admin.from("products").update({ images: updatedImages }).eq("id", product.id);
      }
      successCount++;
    } catch (e) {
      console.error(`خطا در بازتولید تصویر محصول ${src.product_id}:`, e);
      failCount++;
    }
  }
  return { successCount, failCount, total: (sources ?? []).length };
}