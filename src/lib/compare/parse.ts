// منطق مقایسه‌ی محصولات (بدون هوش مصنوعی): فقط از اطلاعاتی که داخل خود محصول ذخیره شده جدول را می‌سازد.
// این فایل "use server" نیست و هیچ دسترسی به دیتابیس ندارد (فقط توابع خالص).

export interface CompareProduct {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  brand: string | null;
  price: number;
  discountPrice: number | null;
  inStock: boolean;
  unit: string | null;                           // مثلاً «متر» برای کالاهای فروشی بر اساس واحد
  features: string[];                            // «ویژگی‌های اصلی» از متن توضیحات
  uses: string[];                                // «کاربردها» از متن توضیحات
  specBullets: string[];                         // «مشخصات فنی» متنی (فقط وقتی هیچ ردیف کلید/مقداری پیدا نشد)
  attributes: { key: string; value: string }[]; // جدول مشخصات (product_attributes یا خطوط «کلید: مقدار» توضیحات)
}

export type CompareCell = string | string[] | null;
export interface CompareRow { label: string; cells: CompareCell[]; same: boolean | null }
export interface CompareGroup { id: string; title: string; rows: CompareRow[]; filterable: boolean }
export interface CompareModel { groups: CompareGroup[]; same: number; diff: number }

const MAX_ITEMS = 12;
const MAX_PAIRS = 40;
const BULLET_RE = /^\s*(?:[-•●▪▫◦*✔✅☑✓→–—]|[\d۰-۹٠-٩]+[.)\-])\s*/u;

type SectionKind = "features" | "uses" | "specs";
type Mode = "none" | SectionKind | "other";

function clip(s: string, max = 160) {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max - 1) + "…" : t;
}

function detectHeading(line: string): { kind: SectionKind | "other" } | null {
  const core = line
    .replace(/^[^\p{L}\p{N}]+/u, "")
    .replace(/[:：\s]+$/u, "")
    .trim();
  if (!core || core.length > 50) return null;
  if (/[.!؟?]$/u.test(core)) return null;     // جمله است، عنوان نیست
  if (/[:：]/u.test(core)) return null;        // «کاربرد: ...» یعنی خط داده، نه عنوان

  const startsWithSymbol = /^[^\p{L}\p{N}\s]/u.test(line);
  const endsWithColon = /[:：]\s*$/u.test(line);

  let kind: SectionKind | null = null;
  if (/^ویژگی/u.test(core)) kind = "features";
  else if (/^کاربرد/u.test(core)) kind = "uses";
  else if (/^مشخصات/u.test(core)) kind = "specs";

  if (kind) {
    if ((startsWithSymbol || endsWithColon || core.length <= 24) && !core.includes("–")) return { kind };
    return null;
  }
  if (startsWithSymbol || endsWithColon) return { kind: "other" }; // عنوان بخش دیگر (نکات، محتویات، سوالات...)
  return null;
}

// «توان: 1 وات (1W)» → { key: "توان", value: "1 وات (1W)" }
function toPair(content: string): { key: string; value: string } | null {
  const m = content.match(/^([^:：]{2,40}?)\s*[:：]\s*(\S.{0,199})$/u);
  if (!m) return null;
  const key = m[1].trim();
  if (!/\p{L}/u.test(key)) return null;
  if (/^(سوال|پرسش|پاسخ|جواب|نکته)/u.test(key)) return null;
  return { key, value: clip(m[2]) };
}

export interface ParsedDescription {
  features: string[];
  uses: string[];
  specList: string[];                           // خطوط مشخصات که به شکل «کلید: مقدار» نبودند
  pairs: { key: string; value: string }[];      // خطوط «کلید: مقدار»
  usesSentence: string | null;                  // اگر بخش کاربردها نبود: جمله‌ای از متن که کلمه‌ی «کاربرد» دارد
}

export function parseDescription(description: string | null | undefined): ParsedDescription {
  const out: ParsedDescription = { features: [], uses: [], specList: [], pairs: [], usesSentence: null };
  if (!description) return out;

  let mode: Mode = "none";
  const intro: string[] = [];

  for (const rawLine of description.replace(/\r/g, "").split("\n")) {
    const line = rawLine.trim();
    if (!line) {
      const filled =
        (mode === "features" && out.features.length > 0) ||
        (mode === "uses" && out.uses.length > 0) ||
        (mode === "specs" && out.pairs.length + out.specList.length > 0);
      if (filled) mode = "none"; // خط خالی بعد از چند آیتم = پایان بخش
      continue;
    }

    const isBullet = BULLET_RE.test(line);
    if (!isBullet) {
      const heading = detectHeading(line);
      if (heading) {
        mode = heading.kind;
        continue;
      }
    }

    const content = clip(line.replace(BULLET_RE, ""));
    if (!content) continue;

    if (mode === "features") {
      if (out.features.length < MAX_ITEMS) out.features.push(content);
    } else if (mode === "uses") {
      if (out.uses.length < MAX_ITEMS) out.uses.push(content);
    } else if (mode === "specs") {
      const pair = toPair(content);
      if (pair) {
        if (out.pairs.length < MAX_PAIRS) out.pairs.push(pair);
      } else if (out.specList.length < MAX_ITEMS) {
        out.specList.push(content);
      }
    } else if (mode === "none") {
      if (isBullet) {
        const pair = toPair(content); // متن‌هایی که عنوان ندارند ولی خط‌های «- کلید: مقدار» دارند
        if (pair && out.pairs.length < MAX_PAIRS) out.pairs.push(pair);
      } else {
        intro.push(line);
      }
    }
  }

  if (out.uses.length === 0) {
    const sentence = intro.join(" ").split(/(?<=[.!؟])\s+/u).find((s) => /کاربرد/u.test(s));
    if (sentence) out.usesSentence = clip(sentence, 220);
  }
  return out;
}

// نرمال‌سازی فقط برای تطبیق ردیف‌ها و مقایسه‌ی مقدارها (نمایش، همان متن اصلی است)
export function normalizeKey(s: string): string {
  return s
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[\u200c\u200f\u200e]/g, " ")
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[:：]+$/u, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function formatPrice(n: number): string {
  return n.toLocaleString("fa-IR");
}
export function finalPrice(p: CompareProduct): number {
  return p.discountPrice ?? p.price;
}
export function discountPercent(p: CompareProduct): number | null {
  return p.discountPrice && p.price > 0 ? Math.round(100 - (p.discountPrice / p.price) * 100) : null;
}

export function buildCompareProduct(
  base: {
    id: string; name: string; slug: string; image: string | null; description: string | null;
    brand: string | null; price: number; discount_price: number | null; stock: number | null;
    is_sold_by_unit: boolean | null; unit_label: string | null;
  },
  attrs: { attr_key: string; attr_value: string }[]
): CompareProduct {
  const parsed = parseDescription(base.description);
  const tableAttrs = attrs
    .map((a) => ({ key: clip(a.attr_key ?? ""), value: clip(a.attr_value ?? "") }))
    .filter((a) => a.key && a.value);
  // اولویت با جدول رسمی مشخصات؛ اگر خالی بود، خطوط «کلید: مقدار» توضیحات
  const attributes = tableAttrs.length > 0 ? tableAttrs : parsed.pairs;

  const price = Number(base.price) || 0;
  const discount = base.discount_price && base.discount_price < price ? Number(base.discount_price) : null;

  return {
    id: base.id,
    name: base.name,
    slug: base.slug,
    image: base.image,
    brand: base.brand?.trim() || null,
    price,
    discountPrice: discount,
    inStock: !(base.stock !== null && base.stock !== undefined && base.stock <= 0),
    unit: base.is_sold_by_unit ? base.unit_label?.trim() || "عدد" : null,
    features: parsed.features,
    uses: parsed.uses.length > 0 ? parsed.uses : parsed.usesSentence ? [parsed.usesSentence] : [],
    specBullets: attributes.length === 0 ? parsed.specList : [],
    attributes,
  };
}

// ارزان‌ترین محصولِ موجود (فقط وقتی مقایسه‌ی قیمت معنا دارد: واحد یکسان و قیمت‌ها متفاوت)
export function findCheapest(products: CompareProduct[]): string | null {
  if (products.length < 2) return null;
  const units = new Set(products.map((p) => p.unit ?? ""));
  if (units.size > 1) return null;
  const candidates = products.filter((p) => p.inStock && finalPrice(p) > 0);
  if (candidates.length === 0) return null;
  const min = Math.min(...candidates.map(finalPrice));
  const winners = candidates.filter((p) => finalPrice(p) === min);
  const distinct = new Set(candidates.map(finalPrice)).size > 1;
  return winners.length === 1 && distinct ? winners[0].slug : null;
}

function cellKey(c: CompareCell): string | null {
  if (c === null) return null;
  if (typeof c === "string") return normalizeKey(c);
  return c.map(normalizeKey).sort().join("|");
}
// «مشابه» یعنی همه‌ی محصولات مقدار دارند و مقدارها یکی است
function isSame(cells: CompareCell[]): boolean {
  const keys = cells.map(cellKey);
  return keys.every((k) => k !== null) && new Set(keys).size === 1;
}

export function buildComparison(products: CompareProduct[]): CompareModel {
  const withSame = (label: string, cells: CompareCell[]): CompareRow => ({ label, cells, same: isSame(cells) });
  const listCells = (pick: (p: CompareProduct) => string[]): CompareCell[] =>
    products.map((p) => {
      const items = pick(p);
      return items.length > 0 ? items : null;
    });
  const anyValue = (cells: CompareCell[]) => cells.some((c) => c !== null);

  // گروه «اطلاعات کلی» (قیمت، موجودی، برند): همیشه نمایش داده می‌شود و در آمار شباهت/تفاوت نمی‌آید
  const info: CompareRow[] = [
    {
      label: "قیمت",
      same: null,
      cells: products.map((p) =>
        finalPrice(p) > 0 ? `${formatPrice(finalPrice(p))} تومان${p.unit ? ` / هر ${p.unit}` : ""}` : null
      ),
    },
    { label: "وضعیت موجودی", same: null, cells: products.map((p) => (p.inStock ? "موجود" : "ناموجود")) },
  ];
  const brandCells: CompareCell[] = products.map((p) => p.brand);
  if (anyValue(brandCells)) info.push({ label: "برند", same: null, cells: brandCells });

  // ردیف‌های مشخصات فنی: اجتماع نام ویژگی‌ها؛ ردیف‌هایی که در بیشتر محصولات هستند بالاتر می‌آیند
  const order: string[] = [];
  const labels = new Map<string, string>();
  const values = new Map<string, (string | null)[]>();
  products.forEach((p, pi) => {
    for (const a of p.attributes) {
      const k = normalizeKey(a.key);
      if (!k) continue;
      if (!values.has(k)) {
        values.set(k, products.map(() => null));
        labels.set(k, a.key);
        order.push(k);
      }
      const row = values.get(k)!;
      row[pi] = row[pi] ? `${row[pi]}، ${a.value}` : a.value;
    }
  });
  const specRows: CompareRow[] = order
    .map((k, idx) => ({ k, idx, cells: values.get(k)!, count: values.get(k)!.filter(Boolean).length }))
    .sort((a, b) => b.count - a.count || a.idx - b.idx)
    .map((r) => withSame(labels.get(r.k)!, r.cells));
  const bulletCells = listCells((p) => p.specBullets);
  if (anyValue(bulletCells)) specRows.push(withSame("مشخصات فنی (از توضیحات محصول)", bulletCells));

  const featureCells = listCells((p) => p.features);
  const useCells = listCells((p) => p.uses);

  const groups: CompareGroup[] = [
    { id: "info", title: "اطلاعات کلی", rows: info, filterable: false },
    { id: "features", title: "ویژگی‌های اصلی", rows: anyValue(featureCells) ? [withSame("ویژگی‌ها", featureCells)] : [], filterable: true },
    { id: "specs", title: "مشخصات فنی", rows: specRows, filterable: true },
    { id: "uses", title: "کاربردها", rows: anyValue(useCells) ? [withSame("کاربردها", useCells)] : [], filterable: true },
  ].filter((g) => g.rows.length > 0);

  const filterableRows = groups.filter((g) => g.filterable).flatMap((g) => g.rows);
  return {
    groups,
    same: filterableRows.filter((r) => r.same === true).length,
    diff: filterableRows.filter((r) => r.same === false).length,
  };
}