// src/app/api/admin/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { uploadImage, deleteImageByUrl } from "@/lib/arvan";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role === "ADMIN";
}

export async function POST(request: NextRequest) {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "فایلی ارسال نشده است" }, { status: 400 });
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let optimized: Buffer = buffer;

    // استفاده از sharp فقط اگر در محیط سرور درست لود شود
    try {
      const sharp = (await import("sharp")).default;
      optimized = await sharp(buffer)
        .resize(1000, 1000, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
    } catch (e) {
      console.error("⚠️ فشرده‌سازی تصویر شکست خورد — فایل خام (بدون بهینه‌سازی) آپلود می‌شود:", e);
      optimized = buffer;
    }

    const key = `products/${randomUUID()}.webp`;
    const url = await uploadImage(optimized, key);

    return NextResponse.json({ url });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "خطا در پردازش یا آپلود تصویر" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  const { url } = await request.json();
  if (!url) {
    return NextResponse.json({ error: "آدرس تصویر مشخص نشده" }, { status: 400 });
  }

  await deleteImageByUrl(url);
  return NextResponse.json({ success: true });
}