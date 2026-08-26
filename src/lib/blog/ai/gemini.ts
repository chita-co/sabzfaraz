const GEMINI_MODEL = "gemini-3.6-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export interface GeneratedArticle {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  suggested_category: string;
  is_new_category: boolean;
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

async function callGeminiJSON(prompt: string): Promise<GeneratedArticle> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY تنظیم نشده است");

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.9, responseMimeType: "application/json" },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    if (res.status === 429) {
      let retryAfterSeconds: number | undefined;
      try {
        const errJson = JSON.parse(errText);
        const retryInfo = errJson?.error?.details?.find((d: { "@type"?: string; retryDelay?: string }) => d["@type"]?.includes("RetryInfo"));
        const delay = retryInfo?.retryDelay as string | undefined;
        if (delay) retryAfterSeconds = parseInt(delay, 10);
      } catch { /* ignore parse errors */ }
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
    return JSON.parse(text) as GeneratedArticle;
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

دسته‌بندی‌های موجود بلاگ: ${input.existingCategories.join("، ") || "هنوز دسته‌ای ثبت نشده"}
سبک مقاله: ${style}
نحوه‌ی شروع مقاله: ${hook}
لحن نوشتار: ${input.tone}
طول مقاله: بین ${input.minWords} تا ${input.maxWords} کلمه.
ساختار: مقدمه‌ی جذاب طبق سبک بالا، بدنه (مزایا، کاربردها، راهنمای خرید، نکات فنی)، جمع‌بندی، بخش سوالات متداول (حداقل ۳ سوال).
جایی مناسب در متن (وسط یا انتهای مقاله) دقیقاً همین عبارت را به‌عنوان جای‌گاه دکمه خرید بگذار: [PRODUCT_CTA]
خروجی content باید HTML ساده باشد (تگ‌های h2, h3, p, ul, li, strong, blockquote) — بدون html, head, body.
${input.customPrompt ? `دستورالعمل اضافی: ${input.customPrompt}` : ""}

فقط یک JSON معتبر با این ساختار دقیق برگردان (بدون Markdown fence، بدون توضیح اضافه):
{
  "title": "عنوان جذاب و سئوشده فارسی (حداکثر ۶۵ کاراکتر)",
  "slug": "کوتاه، انگلیسی، kebab-case، بدون فاصله",
  "excerpt": "خلاصه ۲ تا ۳ خطی",
  "content": "متن کامل مقاله به HTML",
  "suggested_category": "نام دسته‌بندی پیشنهادی (اگر با یکی از دسته‌های موجود همخوانی دارد، دقیقاً همان نام را بنویس)",
  "is_new_category": true یا false,
  "tags": ["برچسب۱", "برچسب۲"],
  "read_time": عدد به دقیقه,
  "meta_title": "عنوان سئو (حداکثر ۶۰ کاراکتر)",
  "meta_description": "توضیح متا (حداکثر ۱۵۵ کاراکتر)",
  "image_prompt": "پرامپت انگلیسی کوتاه برای تولید تصویر کاور ۱۶:۹، بدون متن و بدون برند"
}`.trim();

  return callGeminiJSON(prompt);
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

دسته‌بندی‌های موجود بلاگ: ${input.existingCategories.join("، ") || "هنوز دسته‌ای ثبت نشده"}
ساختار: مقدمه‌ی جذاب طبق سبک بالا، بدنه‌ی کامل با جزئیات فنی و کاربردی، جمع‌بندی، حداقل ۳ سوال متداول.
خروجی content باید HTML ساده باشد (h2, h3, p, ul, li, strong, blockquote) — بدون html, head, body.

فقط یک JSON معتبر با همین ساختار دقیق برگردان (بدون Markdown fence):
{
  "title": "...", "slug": "...", "excerpt": "...", "content": "...",
  "suggested_category": "...", "is_new_category": true یا false,
  "tags": ["..."], "read_time": عدد, "meta_title": "...", "meta_description": "...",
  "image_prompt": "..."
}`.trim();

  return callGeminiJSON(prompt);
}