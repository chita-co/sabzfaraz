import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getPostBySlug } from "@/lib/blog/queries";

export const runtime = "nodejs";
export const alt = "پوستر مقاله سبزفراز";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug);
  const title = post?.title ?? "مجله سبزفراز";
  const fontData = await readFile(path.join(process.cwd(), "public/fonts/Vazirmatn-Bold.woff")).catch(() => null);

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", background: "linear-gradient(135deg,#065f46,#111827)", padding: 60, color: "#fff", fontFamily: fontData ? "Vazir" : undefined }}>
        <div style={{ fontSize: 20, color: "#4ade80", marginBottom: 16 }}>مجله سبزفراز</div>
        <div style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.6, maxWidth: 1000, direction: "rtl" }}>{title}</div>
      </div>
    ),
    { ...size, fonts: fontData ? [{ name: "Vazir", data: fontData, weight: 700 }] : [] }
  );
}