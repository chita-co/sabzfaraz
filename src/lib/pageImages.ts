// src/lib/pageImages.ts
// نوع و اعتبارسنجی تصاویر صفحات «درباره ما»، «تماس با ما»، «انباکس» و «گالری» (بدون "use server"، قابل استفاده در سرور و کلاینت)

export type PageImageAlign = "left" | "center" | "right";
export type PageImageKind = "about" | "contact" | "unboxing" | "gallery";

export type PageImageLayout = "stack" | "row";

export type PageImage = {
  id: string;
  url: string;
  alt: string;
  width: number; // پیکسل
  align: PageImageAlign;
  position: string;
  layout?: PageImageLayout; // stack = مستقل (زیر هم، پیش‌فرض) | row = کنار هم در یک ردیف
  group?: PageImage[]; // فقط برای نمایش (توسط groupRowImages ساخته می‌شود)؛ هرگز ذخیره نمی‌شود
};

export const MIN_IMAGE_WIDTH = 40;
export const MAX_IMAGE_WIDTH = 1000; // تصاویر آپلودشده حداکثر ۱۰۰۰ پیکسل‌اند؛ بزرگ‌تر از این فقط تار می‌شود
export const MAX_IMAGES_PER_PAGE = 20;

export const CONTACT_POSITIONS = ["before_box", "after_box", "beside_left", "beside_right"] as const;
export const UNBOXING_POSITIONS = ["after_hero", "after_rules", "after_channels", "end"] as const;
export const GALLERY_POSITIONS = ["after_hero", "after_instagram", "after_youtube", "end"] as const;

export function isValidAboutPosition(p: string): boolean {
  return p === "after_title" || p === "end" || /^after_p_([1-9]|1\d|20)$/.test(p);
}

export function isValidContactPosition(p: string): boolean {
  return (CONTACT_POSITIONS as readonly string[]).includes(p);
}

export function isValidUnboxingPosition(p: string): boolean {
  return (UNBOXING_POSITIONS as readonly string[]).includes(p);
}

export function isValidGalleryPosition(p: string): boolean {
  return (GALLERY_POSITIONS as readonly string[]).includes(p);
}

export function isValidPosition(kind: PageImageKind, p: string): boolean {
  if (kind === "about") return isValidAboutPosition(p);
  if (kind === "contact") return isValidContactPosition(p);
  if (kind === "unboxing") return isValidUnboxingPosition(p);
  return isValidGalleryPosition(p);
}

export function defaultPositionFor(kind: PageImageKind): string {
  if (kind === "contact") return "after_box";
  return "end";
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
    const position = isValidPosition(kind, rawPos) ? rawPos : defaultPositionFor(kind);

    const alt = typeof o.alt === "string" ? o.alt.trim().slice(0, 200) : "";
    const id = typeof o.id === "string" && o.id.length > 0 && o.id.length <= 64 ? o.id : `img-${out.length + 1}`;

    const layout: PageImageLayout = o.layout === "row" ? "row" : "stack";

    out.push({ id, url, alt, width, align, position, layout });
  }
  return out;
}


// تصاویر پشت‌سرهمِ «کنار هم» (layout = "row") را در یک گروه ادغام می‌کند تا در یک ردیف نمایش داده شوند.
// تصاویر «مستقل» (stack) بدون تغییر و زیر هم می‌مانند.
export function groupRowImages(list: PageImage[]): PageImage[] {
  const out: PageImage[] = [];
  let buffer: PageImage[] = [];
  const flush = () => {
    if (buffer.length === 0) return;
    out.push({ ...buffer[0], id: `group-${buffer[0].id}`, group: buffer });
    buffer = [];
  };
  for (const img of list) {
    if (img.layout === "row") buffer.push(img);
    else {
      flush();
      out.push(img);
    }
  }
  flush();
  return out;
}