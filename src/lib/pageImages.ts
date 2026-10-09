// src/lib/pageImages.ts
// نوع و اعتبارسنجی تصاویر صفحات «درباره ما» و «تماس با ما» (بدون "use server"، قابل استفاده در سرور و کلاینت)

export type PageImageAlign = "left" | "center" | "right";
export type PageImageKind = "about" | "contact";

export type PageImage = {
  id: string;
  url: string;
  alt: string;
  width: number; // پیکسل
  align: PageImageAlign;
  position: string;
};

export const MIN_IMAGE_WIDTH = 40;
export const MAX_IMAGE_WIDTH = 1000; // تصاویر آپلودشده حداکثر ۱۰۰۰ پیکسل‌اند؛ بزرگ‌تر از این فقط تار می‌شود
export const MAX_IMAGES_PER_PAGE = 20;

export const CONTACT_POSITIONS = ["before_box", "after_box", "beside_left", "beside_right"] as const;

export function isValidAboutPosition(p: string): boolean {
  return p === "after_title" || p === "end" || /^after_p_([1-9]|1\d|20)$/.test(p);
}

export function isValidContactPosition(p: string): boolean {
  return (CONTACT_POSITIONS as readonly string[]).includes(p);
}

export function normalizePageImages(raw: unknown, kind: PageImageKind): PageImage[] {
  if (!Array.isArray(raw)) return [];
  const out: PageImage[] = [];
  for (const item of raw.slice(0, MAX_IMAGES_PER_PAGE)) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;

    const url = typeof o.url === "string" ? o.url.trim() : "";
    // فقط آدرس https یا مسیر نسبی (نه //host)
    if (!/^https:\/\//i.test(url) && !/^\/(?!\/)/.test(url)) continue;

    const w = Number(o.width);
    const width = Number.isFinite(w) ? Math.min(MAX_IMAGE_WIDTH, Math.max(MIN_IMAGE_WIDTH, Math.round(w))) : 400;

    const align: PageImageAlign = o.align === "left" || o.align === "right" || o.align === "center" ? o.align : "center";

    const rawPos = typeof o.position === "string" ? o.position : "";
    const position =
      kind === "about"
        ? isValidAboutPosition(rawPos) ? rawPos : "end"
        : isValidContactPosition(rawPos) ? rawPos : "after_box";

    const alt = typeof o.alt === "string" ? o.alt.trim().slice(0, 200) : "";
    const id = typeof o.id === "string" && o.id.length > 0 && o.id.length <= 64 ? o.id : `img-${out.length + 1}`;

    out.push({ id, url, alt, width, align, position });
  }
  return out;
}