// اسکریپت یک‌بارمصرف برای اصلاح اسلاگ‌های خراب محصولات (که به‌خاطر باگ قدیمی slugify،
// حروف فارسی حذف شده بود و فقط عدد یا یه کد تصادفی مونده بود، مثل: 100-250 یا p-a8f2k3).
// این اسکریپت فقط برای همین محصولات خراب اجرا میشه، به بقیه محصولات کاری نداره.
//
// قبل از اجرا:
//   ۱. مطمئن شو ستون previous_slugs رو با این SQL به جدول products اضافه کردی:
//      alter table products add column if not exists previous_slugs text[] default '{}';
//   ۲. مطمئن شو src/lib/slug.ts رو با نسخه‌ی جدید (که حروف فارسی رو نگه می‌داره) عوض کردی.
//
// اجرا: node fix-product-slugs.mjs
// (بعد از اجرا، چون صفحات محصول با ISR یک‌ساعته کش میشن، اسلاگ جدید حداکثر تا ۱ ساعت
//  دیگه روی سایت زنده میشه؛ نیازی به ری‌استارت یا دیپلوی نیست.)

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://sabzfaraz.ir").replace(/\/$/, "");
const INDEXNOW_KEY = process.env.INDEXNOW_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ متغیرهای NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY در .env.local تنظیم نشده‌اند.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// همون تابع اصلاح‌شده‌ی src/lib/slug.ts (چون این اسکریپت مستقل از Next.js اجرا میشه، اینجا هم تکرار شده)
function slugify(input) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[\u200C\u200F\u200E]/g, "")
    .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// اسلاگ‌های "خراب" که باید اصلاح بشن:
// - فقط عدد و خط‌تیره (مثل 100-250، 030-100)
// - الگوی fallback تصادفی قدیمی (مثل p-a8f2k3)
const BROKEN_SLUG_PATTERNS = [/^[0-9]+(-[0-9]+)*$/, /^p-[a-z0-9]{6}$/];

function isBrokenSlug(slug) {
  return BROKEN_SLUG_PATTERNS.some((re) => re.test(slug));
}

async function generateUniqueSlugStandalone(rawInput, excludeId, takenInThisRun) {
  let base = slugify(rawInput);
  if (!base || base.length < 2) {
    base = `p-${Math.random().toString(36).slice(2, 8)}`;
  }

  let candidate = base;
  let suffix = 2;
  while (true) {
    if (takenInThisRun.has(candidate)) {
      candidate = `${base}-${suffix}`;
      suffix++;
      continue;
    }
    let query = supabase.from("products").select("id").eq("slug", candidate);
    if (excludeId) query = query.neq("id", excludeId);
    const { data: dup } = await query.maybeSingle();
    if (!dup) break;
    candidate = `${base}-${suffix}`;
    suffix++;
  }
  takenInThisRun.add(candidate);
  return candidate;
}

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
    console.error("  ⚠️ IndexNow submit failed:", err.message);
  }
}

async function run() {
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? Math.max(1, parseInt(limitArg.split("=")[1], 10) || 0) : 0;
  console.log(limit > 0 ? `⚠️ حالت تست: فقط ${limit} محصول اول اصلاح می‌شود.` : "حالت کامل: همه‌ی محصولات خراب اصلاح می‌شوند.");
  console.log("در حال خواندن همه‌ی محصولات...");
  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, slug, previous_slugs")
    .limit(20000);

  if (error) {
    console.error("❌ خطا در خواندن محصولات:", error.message);
    process.exit(1);
  }

  const broken = (products ?? []).filter((p) => isBrokenSlug(p.slug));
  const targetList = limit > 0 ? broken.slice(0, limit) : broken;
  console.log(`${targetList.length} محصول انتخاب شد از ${broken.length} محصول خراب (از مجموع ${products?.length ?? 0} محصول).\n`);

  if (targetList.length === 0) {
    console.log("چیزی برای اصلاح نیست. ✅");
    return;
  }

  const takenInThisRun = new Set();
  let fixed = 0;
  let skipped = 0;

  for (const p of targetList) {
    const newSlug = await generateUniqueSlugStandalone(p.name, p.id, takenInThisRun);

    if (newSlug === p.slug) {
      // اسم محصول هم چیزی جز عدد/چیز مبهم نداشت (مثلاً واقعاً فقط "100-250" است) — رد میشه، باید دستی چک بشه.
      console.log(`  ⏭️  رد شد (اسم مناسبی برای اسلاگ نداره): ${p.slug} — "${p.name}"`);
      skipped++;
      continue;
    }

    const previousSlugs = Array.from(new Set([...(p.previous_slugs ?? []), p.slug]));

    const { error: updateError } = await supabase
      .from("products")
      .update({ slug: newSlug, previous_slugs: previousSlugs })
      .eq("id", p.id);

    if (updateError) {
      console.error(`  ❌ خطا در آپدیت محصول ${p.id}:`, updateError.message);
      continue;
    }

    console.log(`  ✅ ${p.slug}  →  ${newSlug}   ("${p.name}")`);
    await submitUrlToIndexNow(`${SITE_URL}/products/${newSlug}`);
    fixed++;
  }

  console.log(`\nتمام شد. اصلاح‌شده: ${fixed} — رد شده (نیاز به بررسی دستی): ${skipped}`);
}

run();
