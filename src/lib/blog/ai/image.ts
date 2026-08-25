import sharp from "sharp";
import { uploadImage } from "@/lib/arvan";

export async function generateAndUploadCoverImage(prompt: string, slug: string): Promise<string | null> {
  try {
    const encoded = encodeURIComponent(`${prompt}, high quality, professional photography, 16:9, no text, no watermark`);
    const url = `https://image.pollinations.ai/prompt/${encoded}?width=1280&height=720&nologo=true`;

    const res = await fetch(url);
    if (!res.ok) return null;

    const arrayBuffer = await res.arrayBuffer();
    const webpBuffer = await sharp(Buffer.from(arrayBuffer)).resize(1280, 720, { fit: "cover" }).webp({ quality: 82 }).toBuffer();

    const key = `blog/covers/${slug}-${Date.now()}.webp`;
    return await uploadImage(webpBuffer, key);
  } catch (e) {
    console.error("generateAndUploadCoverImage:", e);
    return null;
  }
}