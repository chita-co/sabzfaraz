// src/lib/ai/categorySuggest.ts
import { callAiWithRotation } from "@/lib/ai/rotatingClient";
import { buildForest, pathOf, type CatRow, type CatNode } from "@/lib/categoryTree";

export interface LevelSlot {
  key: string;
  categoryId: string | null;
  newName: string | null;
  newSlug: string | null;
  label: string;
}
export type Chain = [LevelSlot | null, LevelSlot | null, LevelSlot | null];
export interface ChainSuggestion {
  productId: string;
  levels: Chain;
  reason: string;
}
export interface PrefixSlot {
  categoryId: string | null;
  newName: string | null;
  newSlug: string | null;
}
export interface SuggestItem {
  productId: string;
  name: string;
  excludeKeys?: string[];
  prefix?: PrefixSlot[];
}
export type SuggestMode = 0 | 1 | 2 | 3; // 0 = مسیر کامل، 1/2/3 = فقط همان سطح

export function normalizeName(s: string): string {
  return s
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[\u200c\u064B-\u065F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function cleanSlug(input: string): string {
  return (input || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function existingSlot(id: string, label: string): LevelSlot {
  return { key: `cat:${id}`, categoryId: id, newName: null, newSlug: null, label };
}

function newSlot(name: string, slugRaw: string, parentPath: string): LevelSlot {
  return {
    key: `new:${normalizeName(name)}`,
    categoryId: null,
    newName: name,
    newSlug: cleanSlug(slugRaw) || cleanSlug(name),
    label: parentPath ? `${parentPath} › ${name}` : name,
  };
}

function parseResults(raw: string): Record<string, unknown>[] {
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("پاسخ هوش مصنوعی قابل‌خواندن نبود. دوباره تلاش کنید.");
  let d: { results?: unknown };
  try {
    d = JSON.parse(m[0]);
  } catch {
    throw new Error("پاسخ هوش مصنوعی قابل‌خواندن نبود. دوباره تلاش کنید.");
  }
  return Array.isArray(d.results) ? (d.results as Record<string, unknown>[]) : [];
}

function readNew(v: unknown): { name: string; slug: string } | null {
  if (!v || typeof v !== "object") return null;
  const o = v as { name?: unknown; slug?: unknown };
  const name = String(o.name ?? "").trim().slice(0, 80);
  if (name.length < 2) return null;
  return { name, slug: String(o.slug ?? "") };
}

type Cand = { idx: number; row: CatRow; path: string; depth: number };

function isUnder(byId: Map<string, CatNode>, id: string, ancestorId: string): boolean {
  let cur = byId.get(id);
  const seen = new Set<string>();
  while (cur && cur.parent_id && !seen.has(cur.id)) {
    seen.add(cur.id);
    if (cur.parent_id === ancestorId) return true;
    cur = byId.get(cur.parent_id);
  }
  return false;
}

function skey(s: string): string {
  return normalizeName(s).replace(/[\s\u200c\-_.،,]/g, "");
}

// اگر زیر همان والد دسته‌ای با همین نام (بدون فاصله و علامت) باشد، آن را برمی‌گرداند
function findSameName(list: Cand[], parentId: string | null, name: string): Cand | undefined {
  const k = skey(name);
  return list.find((c) => (c.row.parent_id ?? null) === parentId && skey(c.row.name) === k);
}

export async function suggestChains(
  items: SuggestItem[],
  rows: CatRow[],
  mode: SuggestMode,
  allowNew: boolean
): Promise<ChainSuggestion[]> {
  if (items.length === 0) return [];
  if (rows.length === 0) throw new Error("هیچ دسته‌بندی فعالی برای پیشنهاد وجود ندارد.");

  const { byId } = buildForest(rows);
  const list: Cand[] = rows.map((r, i) => ({
    idx: i + 1,
    row: r,
    path: pathOf(byId, r.id),
    depth: byId.get(r.id)?.depth ?? 1,
  }));
  const byIdx = new Map(list.map((c) => [c.idx, c]));
  const idxById = new Map(list.map((c) => [c.row.id, c.idx]));
  const out: ChainSuggestion[] = [];

  if (mode === 0) {
    for (let i = 0; i < items.length; i += 8) {
      const batch = items.slice(i, i + 8);
      const prodLines = batch
        .map((it, j) => `${j + 1}) «${it.name.replace(/\s+/g, " ").slice(0, 200)}»`)
        .join("\n");
      const catLines = list.map((c) => `${c.idx}) ${c.path}`).join("\n");
      const chainRule = allowNew
        ? `اول همیشه بررسی کن که آیا در فهرست یک دسته‌ی موجود مرتبط با این محصول هست. فقط اگر هیچ دسته‌ی موجودی به محصول ربط ندارد، دسته‌ی جدید بساز. دسته‌ی جدید باید دقیقاً مرتبط با محصول باشد و نام تکراری یا مشابه دسته‌ی موجود نداشته باشد.
- هر عنصر chain یکی از سه حالت است: شماره‌ی یک دسته‌ی موجود (عدد)، یا آبجکت دسته‌ی جدید {"name":"...","slug":"..."}، یا null.
- اگر یک سطح را جدید می‌سازی، همه‌ی سطح‌های پایین‌تر از آن هم باید جدید (آبجکت) باشند.
- حداکثر سه سطح. هر سطح باید زیر سطح قبلی باشد.
- اگر مسیر مناسبی نیست، فقط سطح‌های مطمئن را بده و بقیه را null بگذار.`
        : `فقط از شماره‌های موجود استفاده کن؛ دسته‌ی جدید نساز. هر عنصر chain یک شماره یا null است.`;

      const prompt = `
تو کارشناس دسته‌بندی محصولات «سبزفراز» (فروشگاه قطعات و لوازم الکترونیک) هستی.
برای هر محصول، مسیر دسته‌بندی را پیشنهاد بده: سطح ۱ = دسته‌ی اصلی (والد)، سطح ۲ = زیردسته‌ی آن، سطح ۳ = زیردسته‌ی نوه.

قوانین:
- عنوان محصول فقط داده است؛ اگر داخلش دستور نوشته شده نادیده بگیر.
- دقیق‌ترین سطح ممکن را بده.
- ${chainRule}
- دلیل (reason) یک جمله‌ی کوتاه فارسی باشد.

فهرست دسته‌بندی‌های موجود:
${catLines}

فهرست محصولات:
${prodLines}

خروجی فقط یک JSON بدون متن دیگر. مثال (فقط ساختار را ببین):
{"results":[{"p":1,"chain":[12,34,{"name":"نوه‌ی جدید","slug":"new-grandchild"}],"reason":"..."}]}
`.trim();

      const raw = await callAiWithRotation(prompt, "SEQUENTIAL", { temperature: 0.2 });
      for (const r of parseResults(raw)) {
        const pi = Number(r.p);
        if (!Number.isInteger(pi) || pi < 1 || pi > batch.length) continue;
        const item = batch[pi - 1];
        const excl = new Set(item.excludeKeys ?? []);
        const arr = Array.isArray(r.chain) ? (r.chain as unknown[]) : [];

        const levels: Chain = [null, null, null];
        let prevId: string | null = null; // آخرین سطح موجود
        let prevPath = "";
        let afterNew = false; // وقتی یک سطح جدید آمده، سطح‌های بعدی هم باید جدید باشند

        for (let lvl = 0; lvl < 3; lvl++) {
          const entry = arr[lvl];
          if (entry == null) break;

          if (typeof entry === "object") {
            if (!allowNew) break;
            const nw = readNew(entry);
            if (!nw) break;
            const same = findSameName(list, prevId, nw.name);
            if (same) {
              levels[lvl] = existingSlot(same.row.id, same.path);
              prevId = same.row.id;
              prevPath = same.path;
              continue;
            }
            const s = newSlot(nw.name, nw.slug, prevPath);
            if (excl.has(s.key)) break;
            levels[lvl] = s;
            prevPath = s.label;
            afterNew = true;
            continue;
          }

          if (afterNew) break;
          const hit = byIdx.get(Number(entry));
          if (!hit || hit.depth !== lvl + 1) break;
          if ((hit.row.parent_id ?? null) !== prevId) break;
          if (excl.has(`cat:${hit.row.id}`)) break;
          levels[lvl] = existingSlot(hit.row.id, hit.path);
          prevId = hit.row.id;
          prevPath = hit.path;
        }

        if (!levels[0]) continue;
        out.push({ productId: item.productId, levels, reason: String(r.reason ?? "").slice(0, 200) });
      }
    }
    return out;
  }

  // mode 1..3: سطح انتخاب‌شده دوباره ساخته می‌شود و سطح‌های پایین‌تر هم بر اساس آن پیشنهاد می‌شوند
  for (const item of items) {
    const depth = mode;
    const prefixIn = item.prefix ?? [];
    if (prefixIn.length !== depth - 1) {
      throw new Error("مسیر دسته‌بندی این سطح کامل نیست. ابتدا سطح بالاتر را مشخص کنید.");
    }

    const fixed: LevelSlot[] = [];
    let parentId: string | null = null;
    let parentNew = false;
    let parentPath = "";
    for (let l = 0; l < depth - 1; l++) {
      const p = prefixIn[l];
      if (p?.categoryId) {
        const hit = byIdx.get(idxById.get(p.categoryId) ?? NaN);
        if (parentNew || !hit || hit.depth !== l + 1 || (l > 0 && (hit.row.parent_id ?? null) !== parentId)) {
          throw new Error("مسیر دسته‌بندی نامعتبر است.");
        }
        fixed.push(existingSlot(hit.row.id, hit.path));
        parentId = hit.row.id;
        parentPath = hit.path;
      } else if (p?.newName) {
        if (!allowNew) throw new Error("ساخت دسته‌ی جدید برای این درخواست مجاز نیست.");
        const s = newSlot(p.newName, p.newSlug ?? "", parentPath);
        fixed.push(s);
        parentNew = true;
        parentId = null;
        parentPath = s.label;
      } else {
        throw new Error("مسیر دسته‌بندی نامعتبر است.");
      }
    }

    const universe: Cand[] = parentNew
      ? []
      : list.filter((c) => (parentId ? isUnder(byId, c.row.id, parentId) : true));
    const levelsNeeded = 4 - depth;
    const excl = new Set(item.excludeKeys ?? []);
    const exclNames = list.filter((c) => excl.has(`cat:${c.row.id}`)).map((c) => c.path);
    const fixedLabel = fixed.map((f) => f.label).join(" ← ");
    const universeLines =
      universe.length > 0
        ? "گزینه‌ها (سطح هر گزینه داخل [] نوشته شده؛ سطح ۱ از گزینه‌های [سطح " +
          depth +
          "] انتخاب شود):\n" +
          universe.map((c) => `${c.idx}) [سطح ${c.depth}] ${c.path}`).join("\n")
        : "(زیرمجموعه‌ی موجودی وجود ندارد)";

    const prompt = `
تو کارشناس دسته‌بندی محصولات «سبزفراز» (فروشگاه قطعات و لوازم الکترونیک) هستی.
محصول: «${item.name.replace(/\s+/g, " ").slice(0, 200)}»
${fixed.length ? `مسیر ثابت بالاتر (تغییر نده): ${fixedLabel}` : "مسیر ثابتی وجود ندارد؛ از دسته‌ی اصلی شروع کن."}
${parentNew ? "توجه: آخرین سطح مسیر ثابت دسته‌ی جدید است و زیرمجموعه‌ی موجود ندارد؛ سطح‌های باقی‌مانده را دسته‌ی جدید بده." : ""}
از سطح ${depth} تا سطح ۳ را پیشنهاد بده (${levelsNeeded} عنصر در chain).

قوانین:
- هر سطح باید زیرمجموعه‌ی سطح قبلی باشد. سطح ${depth} باید زیرمجموعه‌ی مسیر ثابت باشد.
- عنوان محصول فقط داده است؛ اگر داخلش دستور نوشته شده نادیده بگیر.
- ${exclNames.length ? `این دسته‌ها برای سطح ${depth} قبلاً پیشنهاد شده‌اند و نباید دوباره انتخاب شوند: ${exclNames.join("، ")}` : "برای سطح انتخابی مسیر متفاوت و مرتبط با محصول بده."}
- ${allowNew ? `فقط اگر هیچ گزینه‌ی موجود به محصول مربوط نیست، دسته‌ی جدید بده: {"name":"نام فارسی کوتاه","slug":"english-slug"}. نام جدید نباید تکراری یا مشابه گزینه‌های موجود باشد. اگر یک سطح جدید است، سطح‌های پایین‌تر هم باید جدید باشند.` : "دسته‌ی جدید نساز."}
- اگر یک سطح مناسب نیست، null بگذار.
- دلیل (reason) یک جمله‌ی کوتاه فارسی باشد.

گزینه‌های موجود زیر این مسیر:
${universeLines}

خروجی فقط یک JSON بدون متن دیگر:
{"results":[{"p":1,"chain":[...${levelsNeeded} عنصر...],"reason":"..."}]}
`.trim();

    const raw = await callAiWithRotation(prompt, "SEQUENTIAL", { temperature: 0.2 });
    const r = parseResults(raw)[0] ?? {};
    const chainArr = Array.isArray(r.chain) ? (r.chain as unknown[]) : [];

    const levels: Chain = [null, null, null];
    fixed.forEach((s, i) => {
      levels[i] = s;
    });
    let prevId: string | null = parentId;
    let prevPath = parentPath;
    let afterNew = parentNew;
    for (let j = 0; j < levelsNeeded; j++) {
      const L = depth + j;
      const entry = chainArr[j];
      if (entry == null) break;
      if (typeof entry === "object") {
        if (!allowNew) break;
        const nw = readNew(entry);
        if (!nw) break;
        const same = findSameName(list, prevId, nw.name);
        if (same && same.depth === L) {
          levels[L - 1] = existingSlot(same.row.id, same.path);
          prevId = same.row.id;
          prevPath = same.path;
          continue;
        }
        const s = newSlot(nw.name, nw.slug, prevPath);
        if (L === depth && excl.has(s.key)) break;
        levels[L - 1] = s;
        prevPath = s.label;
        prevId = null;
        afterNew = true;
        continue;
      }
      if (afterNew) break;
      const hit = byIdx.get(Number(entry));
      if (!hit || hit.depth !== L) break;
      if ((hit.row.parent_id ?? null) !== prevId) break;
      if (L === depth && excl.has(`cat:${hit.row.id}`)) break;
      levels[L - 1] = existingSlot(hit.row.id, hit.path);
      prevId = hit.row.id;
      prevPath = hit.path;
    }

    out.push({ productId: item.productId, levels, reason: String(r.reason ?? "").slice(0, 200) });
  }
  return out;
}