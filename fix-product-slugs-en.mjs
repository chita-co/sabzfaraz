// اسکریپت تبدیل اسلاگ فارسی محصولات به انگلیسی (بر اساس ستون name_en)
//
// - به محصولاتی که اسلاگشان از قبل کاملاً انگلیسی است دست نمی‌زند.
// - اسلاگ قدیمی (فارسی) به previous_slugs اضافه می‌شود؛ ریدایرکت ۳۰۸ همان کدی است که الان توی
//   src/app/(shop)/products/[slug]/page.tsx دارید (permanentRedirect) و تغییری لازم ندارد.
// - محصولی که name_en ندارد (یا name_en اش قابل استفاده نیست) رد می‌شود و در انتها لیستش چاپ می‌شود.
//
// اجرا (به ترتیب):
//   node fix-product-slugs-en.mjs                 ← فقط گزارش (چیزی در دیتابیس عوض نمی‌شود)
//   node fix-product-slugs-en.mjs --limit=3 --apply   ← فقط ۳ محصول اول را واقعاً عوض کن (تست)
//   node fix-product-slugs-en.mjs --apply         ← همه

import { config } from "dotenv";
config({ path: ".env" });

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://sabzfaraz.ir").replace(/\/$/, "");
const INDEXNOW_KEY = process.env.INDEXNOW_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY در .env پیدا نشد.");
  process.exit(1);
}

const APPLY = process.argv.includes("--apply");
const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const LIMIT = limitArg ? Math.max(1, parseInt(limitArg.split("=")[1], 10) || 0) : 0;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function slugifyEn(input) {
  if (!input) return "";
  let s = String(input)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/(\d)[.,](\d)/g, "$1-$2")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  if (s.length > 80) {
    s = s.slice(0, 80);
    const i = s.lastIndexOf("-");
    if (i > 40) s = s.slice(0, i);
    s = s.replace(/-$/, "");
  }
  return s;
}

const hasPersian = (s) => /[\u0600-\u06FF]/.test(s);
const isUsable = (s) => s.length >= 6 && /[a-z]/.test(s);

async function submitUrlToIndexNow(url) {
  if (!INDEXNOW_KEY) return;
  const host = SITE_URL.replace(/^https?:\/\//, "");
  try {
    await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ host, key: INDEXNOW_KEY, urlList: [url] }),
    });
  } catch (err) {
    console.error("  ⚠️ IndexNow:", err.message);
  }
}

async function run() {
  console.log(APPLY ? "🔴 حالت واقعی (--apply): دیتابیس تغییر می‌کند." : "🟢 حالت گزارش: چیزی تغییر نمی‌کند.");

  const products = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, name_en, slug, previous_slugs")
      .order("id")
      .range(from, from + 999);
    if (error) { console.error("❌ خطا در خواندن:", error.message); process.exit(1); }
    products.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }

  // همه‌ی اسلاگ‌های موجود (برای جلوگیری از تکراری شدن)
  const taken = new Set(products.map((p) => p.slug));

  const targets = products.filter((p) => hasPersian(p.slug));
  const list = LIMIT > 0 ? targets.slice(0, LIMIT) : targets;
  console.log(`کل محصولات: ${products.length} | اسلاگ فارسی (نیازمند تبدیل): ${targets.length} | این اجرا: ${list.length}\n`);

  let fixed = 0;
  const skipped = [];

  for (const p of list) {
    const base = slugifyEn(p.name_en);
    if (!isUsable(base)) {
      skipped.push(p);
      continue;
    }

    let candidate = base;
    let n = 2;
    while (taken.has(candidate) && candidate !== p.slug) {
      candidate = `${base}-${n++}`;
    }

    console.log(`  ${APPLY ? "✅" : "👁️ "} ${p.slug}\n       → ${candidate}`);
    taken.add(candidate);

    if (!APPLY) { fixed++; continue; }

    const previousSlugs = Array.from(new Set([...(p.previous_slugs ?? []), p.slug]));
    const { error } = await supabase
      .from("products")
      .update({ slug: candidate, previous_slugs: previousSlugs })
      .eq("id", p.id);
    if (error) { console.error(`  ❌ ${p.id}: ${error.message}`); continue; }

    await submitUrlToIndexNow(`${SITE_URL}/products/${encodeURIComponent(candidate)}`);
    fixed++;
  }

  console.log(`\n${APPLY ? "تبدیل شد" : "قابل تبدیل"}: ${fixed} | رد شده (name_en ندارد/نامناسب): ${skipped.length}`);
  if (skipped.length) {
    console.log("\nمحصولات رد شده (name_en را برایشان پر کن و دوباره اجرا کن):");
    for (const p of skipped) console.log(`  - ${p.id} | ${p.name} | name_en="${p.name_en ?? ""}"`);
  }
}

run();
