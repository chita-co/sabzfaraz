const GEMINI_MODEL = "gemini-3.6-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export interface GeneratedArticle {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  suggested_category: string;
  is_new_category: boolean;
  parent_category_hint?: string | null;
  tags: string[];
  read_time: number;
  meta_title: string;
  meta_description: string;
  image_prompt: string;
}

export interface RateLimitError extends Error {
  isRateLimit: true;
  retryAfterSeconds?: number;
}

export interface CategorySuggestion {
  matched_category: string | null;
  is_new_category: boolean;
  new_category_name?: string | null;
  parent_category_hint?: string | null;
}

const ARTICLE_STYLES = [
  "مقاله‌ی راهنمای خرید گام‌به‌گام با تیترهای کاربردی",
  "مقاله‌ی مقایسه‌ای که چند گزینه را کنار هم می‌گذارد",
  "مقاله‌ی روایی که با یک سناریوی واقعی از زندگی کاربر شروع می‌شود",
  "مقاله‌ی پرسش‌وپاسخ (FAQ-محور) با زیرعنوان‌های سوالی",
  "مقاله‌ی چک‌لیستی و فهرست‌وار با نکات کوتاه و کاربردی",
  "مقاله‌ی تحلیلی و فنی عمیق برای مخاطب حرفه‌ای",
];
const HOOK_STYLES = [
  "با یک سوال چالش‌برانگیز شروع کن",
  "با یک آمار یا واقعیت جالب شروع کن",
  "با توصیف یک مشکل رایج کاربران شروع کن",
  "با یک جمله‌ی کوتاه و ضربه‌ای شروع کن",
];
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function callGeminiJSON<T>(prompt: string, temperature = 0.9): Promise<T> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY تنظیم نشده است");

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature, responseMimeType: "application/json" },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    if (res.status === 429) {
      let retryAfterSeconds: number | undefined;
      try {
        const errJson = JSON.parse(errText);
        const retryInfo = errJson?.error?.details?.find((d: { "@type"?: string }) => d["@type"]?.includes("RetryInfo"));
        const delay = retryInfo?.retryDelay as string | undefined;
        if (delay) retryAfterSeconds = parseInt(delay, 10);
      } catch { /* ignore */ }
      const err = new Error("سهمیه‌ی رایگان Gemini برای الان تمام شده است") as RateLimitError;
      err.isRateLimit = true;
      err.retryAfterSeconds = retryAfterSeconds;
      throw err;
    }
    throw new Error(`خطای Gemini API (${res.status}): ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("پاسخ نامعتبر از Gemini");
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("پارس‌کردن JSON خروجی Gemini ناموفق بود");
  }
}

export async function generateArticleWithGemini(input: {
  productName: string;
  description: string;
  shortDescription?: string | null;
  price: number;
  brand?: string | null;
  existingCategories: string[];
  tone: string;
  minWords: number;
  maxWords: number;
  customPrompt?: string | null;
}): Promise<GeneratedArticle> {
  const style = pickRandom(ARTICLE_STYLES);
  const hook = pickRandom(HOOK_STYLES);

  const prompt = `
تو یک نویسنده‌ی محتوای فارسی، حرفه‌ای و سئوکار برای فروشگاه اینترنتی لوازم الکترونیک «سبزفراز» هستی.
برای محصول زیر یک مقاله‌ی کامل و جذاب مجله‌ای بنویس.

اطلاعات محصول:
- نام: ${input.productName}
- برند: ${input.brand ?? "نامشخص"}
- قیمت: ${input.price.toLocaleString("fa-IR")} تومان
- توضیح کوتاه: ${input.shortDescription ?? "-"}
- توضیح کامل: ${input.description}

دسته‌بندی‌های موجود بلاگ (به‌صورت درختی، «والد > فرزند»): 
${input.existingCategories.join("\n") || "هنوز دسته‌ای ثبت نشده"}

سبک مقاله: ${style}
نحوه‌ی شروع مقاله: ${hook}
لحن نوشتار: ${input.tone}
طول مقاله: بین ${input.minWords} تا ${input.maxWords} کلمه.
ساختار: مقدمه‌ی جذاب طبق سبک بالا، بدنه (مزایا، کاربردها، راهنمای خرید، نکات فنی)، جمع‌بندی، بخش سوالات متداول (حداقل ۳ سوال).
جایی مناسب در متن (وسط یا انتهای مقاله) دقیقاً همین عبارت را به‌عنوان جای‌گاه دکمه خرید بگذار: [PRODUCT_CTA]
خروجی content باید HTML ساده باشد (تگ‌های h2, h3, p, ul, li, strong, blockquote) — بدون html, head, body.
${input.customPrompt ? `دستورالعمل اضافی: ${input.customPrompt}` : ""}

برای دسته‌بندی: اگر یکی از دسته‌های موجود (فقط نام خودِ دسته، بدون والدش) کاملاً مناسبه، همون رو در suggested_category بنویس. اگر دسته‌ی جدیدی لازمه، نام دسته‌ی جدید رو در suggested_category و نام دسته‌ی والدِ مناسب (اگر مقاله زیرمجموعه‌ی یکی از دسته‌های موجوده) رو در parent_category_hint بنویس؛ اگر والد مناسبی نیست، parent_category_hint را null بگذار.

فقط یک JSON معتبر با این ساختار دقیق برگردان (بدون Markdown fence، بدون توضیح اضافه):
{
  "title": "عنوان جذاب و سئوشده فارسی (حداکثر ۶۵ کاراکتر)",
  "slug": "کوتاه، انگلیسی، kebab-case، بدون فاصله",
  "excerpt": "خلاصه ۲ تا ۳ خطی",
  "content": "متن کامل مقاله به HTML",
  "suggested_category": "نام خودِ دسته (بدون والد)",
  "is_new_category": true یا false,
  "parent_category_hint": "نام دسته والد یا null",
  "tags": ["برچسب۱", "برچسب۲"],
  "read_time": عدد به دقیقه,
  "meta_title": "عنوان سئو (حداکثر ۶۰ کاراکتر)",
  "meta_description": "توضیح متا (حداکثر ۱۵۵ کاراکتر)",
  "image_prompt": "پرامپت انگلیسی کوتاه برای تولید تصویر کاور ۱۶:۹، بدون متن و بدون برند"
}`.trim();

  return callGeminiJSON<GeneratedArticle>(prompt, 0.9);
}

export async function generateArticleFromTopic(input: {
  topic: string;
  briefing?: string | null;
  existingCategories: string[];
  tone: string;
  minWords: number;
  maxWords: number;
  recommendedProduct?: { name: string; price: number; description: string } | null;
}): Promise<GeneratedArticle> {
  const style = pickRandom(ARTICLE_STYLES);
  const hook = pickRandom(HOOK_STYLES);

  const prompt = `
تو یک نویسنده‌ی محتوای فارسی، حرفه‌ای و سئوکار برای مجله‌ی فروشگاه اینترنتی «سبزفراز» هستی.

موضوع مقاله: ${input.topic}
${input.briefing ? `توضیح تکمیلی از تیم محتوا: ${input.briefing}` : ""}

سبک مقاله: ${style}
نحوه‌ی شروع مقاله: ${hook}
لحن نوشتار: ${input.tone}
طول مقاله: بین ${input.minWords} تا ${input.maxWords} کلمه.

${input.recommendedProduct ? `
در بخش پایانی مقاله، به‌طور طبیعی و بدون تبلیغاتی‌بودن، بحث را به سمت این محصول ببر و آن را به‌عنوان گزینه‌ی جایگزین/به‌روزتر معرفی کن:
نام محصول: ${input.recommendedProduct.name}
قیمت: ${input.recommendedProduct.price.toLocaleString("fa-IR")} تومان
توضیح: ${input.recommendedProduct.description}
دقیقاً همین عبارت را در همان‌جا بگذار: [PRODUCT_CTA]
` : "این مقاله لزوماً نیازی به معرفی محصول خاصی از فروشگاه ندارد؛ صرفاً یک مقاله‌ی آموزشی/توضیحی معتبر و کامل بنویس."}

دسته‌بندی‌های موجود بلاگ (به‌صورت درختی، «والد > فرزند»): 
${input.existingCategories.join("\n") || "هنوز دسته‌ای ثبت نشده"}
ساختار: مقدمه‌ی جذاب طبق سبک بالا، بدنه‌ی کامل با جزئیات فنی و کاربردی، جمع‌بندی، حداقل ۳ سوال متداول.
خروجی content باید HTML ساده باشد (h2, h3, p, ul, li, strong, blockquote) — بدون html, head, body.

برای دسته‌بندی: اگر یکی از دسته‌های موجود مناسبه، اسمش رو در suggested_category بذار. اگر دسته‌ی جدیدی لازمه، نامش رو در suggested_category و در صورت وجود دسته‌ی والد مناسب، نامش رو در parent_category_hint بذار (وگرنه null).

فقط یک JSON معتبر با همین ساختار دقیق برگردان (بدون Markdown fence):
{
  "title": "...", "slug": "...", "excerpt": "...", "content": "...",
  "suggested_category": "...", "is_new_category": true یا false, "parent_category_hint": "... یا null",
  "tags": ["..."], "read_time": عدد, "meta_title": "...", "meta_description": "...",
  "image_prompt": "..."
}`.trim();

  return callGeminiJSON<GeneratedArticle>(prompt, 0.9);
}

export async function classifyArticleCategory(input: {
  title: string;
  excerpt: string;
  categoryTree: string[];
}): Promise<CategorySuggestion> {
  const prompt = `
دسته‌بندی‌های موجود بلاگ (به‌صورت درختی، «والد > فرزند»):
${input.categoryTree.join("\n") || "هنوز دسته‌ای ثبت نشده"}

عنوان مقاله: ${input.title}
خلاصه مقاله: ${input.excerpt}

بهترین دسته‌بندیِ موجود برای این مقاله را انتخاب کن (فقط نام خودِ دسته، بدون والدش). اگر هیچ‌کدام واقعاً مناسب نبود، یک نام دسته‌بندی جدید و در صورت لزوم نام دسته‌ی والد مناسب پیشنهاد بده.

فقط یک JSON با این ساختار دقیق برگردان:
{
  "matched_category": "نام دقیق یکی از دسته‌های موجود، یا null اگر هیچ‌کدام مناسب نیست",
  "is_new_category": true یا false,
  "new_category_name": "نام دسته‌ی جدید پیشنهادی، یا null",
  "parent_category_hint": "نام دسته‌ی والد پیشنهادی برای دسته جدید، یا null"
}`.trim();

  return callGeminiJSON<CategorySuggestion>(prompt, 0.3);
}