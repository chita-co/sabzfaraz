import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { uploadImage } from "@/lib/arvan";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "فایلی ارسال نشده" }, { status: 400 });

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const optimized = await sharp(buffer).resize(1400, 1400, { fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
    const key = `bulk-orders/${randomUUID()}.webp`;
    const url = await uploadImage(optimized, key);
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: "خطا در آپلود تصویر" }, { status: 500 });
  }
}